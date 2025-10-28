import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Heading,
  Badge,
  Flex,
  useDisclosure,
  useBreakpointValue,
  // Drawer components
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerCloseButton,
  DrawerOverlay,
  DrawerContent,
} from "@chakra-ui/react";
import { SearchIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { useQuery } from "react-query";
import { useSearchParams } from "react-router-dom";
import api from "../config/axios";

import ProductCard from "../components/Product/ProductCard";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import ErrorMessage from "../components/UI/ErrorMessage";

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // URL parameters
  const page = parseInt(searchParams.get("page")) || 1;
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  // Local state
  const [localSearch, setLocalSearch] = useState(search);
  const [localFilters, setLocalFilters] = useState({
    sort,
    order,
    minPrice,
    maxPrice,
  });

  // Fetch products
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery(
    ["products", page, category, search, sort, order, minPrice, maxPrice],
    () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        sort,
        order,
        status: "active",
      });

      if (category) params.append("category", category);
      if (search) params.append("search", search);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);

      return api.get(`/products?${params}`).then((res) => res.data);
    }
  );

  // Fetch categories
  const { data: categoriesData } = useQuery("categories", () =>
    api.get("/categories").then((res) => res.data.categories)
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchParams({ search: localSearch.trim(), page: "1" });
    } else {
      setSearchParams((prev) => {
        prev.delete("search");
        prev.set("page", "1");
        return prev;
      });
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);

    // Update URL parameters
    setSearchParams((prev) => {
      if (value) {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      prev.set("page", "1");
      return prev;
    });
  };

  const clearFilters = () => {
    setLocalSearch("");
    setLocalFilters({
      sort: "createdAt",
      order: "desc",
      minPrice: "",
      maxPrice: "",
    });
    setSearchParams({ page: "1" });
  };

  const FilterSidebar = () => (
    <VStack spacing={6} align="stretch">
      {/* Search */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          Search Products
        </Text>
        <form onSubmit={handleSearch}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search products..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </InputGroup>
        </form>
      </Box>

      {/* Categories */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          Categories
        </Text>
        <VStack spacing={2} align="stretch">
          <Button
            variant={!category ? "solid" : "ghost"}
            colorScheme={!category ? "brand" : "gray"}
            size="sm"
            justifyContent="flex-start"
            onClick={() => handleFilterChange("category", "")}
          >
            All Categories
          </Button>
          {categoriesData?.map((cat) => (
            <Button
              key={cat._id}
              variant={category === cat._id ? "solid" : "ghost"}
              colorScheme={category === cat._id ? "brand" : "gray"}
              size="sm"
              justifyContent="flex-start"
              onClick={() => handleFilterChange("category", cat._id)}
            >
              {cat.name}
            </Button>
          ))}
        </VStack>
      </Box>

      {/* Price Range */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          Price Range
        </Text>
        <HStack spacing={2}>
          <Input
            placeholder="Min"
            size="sm"
            type="number"
            value={localFilters.minPrice}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, minPrice: e.target.value }))
            }
            onBlur={() => handleFilterChange("minPrice", localFilters.minPrice)}
          />
          <Text fontSize="sm">to</Text>
          <Input
            placeholder="Max"
            size="sm"
            type="number"
            value={localFilters.maxPrice}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, maxPrice: e.target.value }))
            }
            onBlur={() => handleFilterChange("maxPrice", localFilters.maxPrice)}
          />
        </HStack>
      </Box>

      {/* Sort */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          Sort By
        </Text>
        <Select
          size="sm"
          value={`${localFilters.sort}-${localFilters.order}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split("-");
            handleFilterChange("sort", sort);
            handleFilterChange("order", order);
          }}
        >
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
          <option value="salesCount-desc">Best Sellers</option>
        </Select>
      </Box>

      {/* Clear Filters */}
      <Button
        variant="outline"
        size="sm"
        onClick={clearFilters}
        colorScheme="red"
      >
        Clear All Filters
      </Button>
    </VStack>
  );

  const Pagination = () => {
    if (!productsData?.pagination) return null;

    const { currentPage, totalPages, hasNextPage, hasPrevPage } =
      productsData.pagination;

    return (
      <Flex justify="center" align="center" gap={2} mt={8}>
        <Button
          size="sm"
          isDisabled={!hasPrevPage}
          onClick={() =>
            setSearchParams((prev) => ({
              ...prev,
              page: (currentPage - 1).toString(),
            }))
          }
        >
          Previous
        </Button>

        <HStack spacing={1}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={pageNum}
                size="sm"
                colorScheme={currentPage === pageNum ? "brand" : "gray"}
                variant={currentPage === pageNum ? "solid" : "outline"}
                onClick={() =>
                  setSearchParams((prev) => ({
                    ...prev,
                    page: pageNum.toString(),
                  }))
                }
              >
                {pageNum}
              </Button>
            );
          })}
        </HStack>

        <Button
          size="sm"
          isDisabled={!hasNextPage}
          onClick={() =>
            setSearchParams((prev) => ({
              ...prev,
              page: (currentPage + 1).toString(),
            }))
          }
        >
          Next
        </Button>
      </Flex>
    );
  };

  return (
    <>
      <Helmet>
        <title>Products - Koseli Mart</title>
        <meta
          name="description"
          content="Browse our wide selection of authentic Nepali products and groceries."
        />
      </Helmet>

      <Box py={8}>
        <Container maxW="7xl">
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <VStack spacing={4} textAlign="center">
              <Heading as="h1" fontSize="3xl" fontWeight="bold">
                Our Products
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl">
                Discover authentic Nepali products carefully selected for
                quality and tradition
              </Text>
            </VStack>

            {/* Filters and Results */}
            <Grid templateColumns={{ base: "1fr", lg: "250px 1fr" }} gap={8}>
              {/* Mobile Filter Button */}
              {isMobile && (
                <Button
                  leftIcon={<ChevronDownIcon />}
                  onClick={onOpen}
                  variant="outline"
                  mb={4}
                >
                  Filters
                </Button>
              )}

              {/* Desktop Sidebar */}
              {!isMobile && (
                <GridItem>
                  <Box
                    p={6}
                    bg="white"
                    borderRadius="xl"
                    boxShadow="sm"
                    border="1px solid"
                    borderColor="gray.200"
                    position="sticky"
                    top="100px"
                  >
                    <FilterSidebar />
                  </Box>
                </GridItem>
              )}

              {/* Products Grid */}
              <GridItem>
                <VStack spacing={6} align="stretch">
                  {/* Results Header */}
                  <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={4}
                  >
                    <Text color="gray.600">
                      {productsData?.pagination?.totalProducts || 0} products
                      found
                      {search && ` for "${search}"`}
                      {category &&
                        ` in ${
                          categoriesData?.find((c) => c._id === category)?.name
                        }`}
                    </Text>

                    {!isMobile && (
                      <Select
                        size="sm"
                        w="200px"
                        value={`${sort}-${order}`}
                        onChange={(e) => {
                          const [newSort, newOrder] = e.target.value.split("-");
                          handleFilterChange("sort", newSort);
                          handleFilterChange("order", newOrder);
                        }}
                      >
                        <option value="createdAt-desc">Newest First</option>
                        <option value="createdAt-asc">Oldest First</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="name-asc">Name: A to Z</option>
                        <option value="name-desc">Name: Z to A</option>
                        <option value="salesCount-desc">Best Sellers</option>
                      </Select>
                    )}
                  </Flex>

                  {/* Products */}
                  {isLoading ? (
                    <LoadingSpinner message="Loading products..." />
                  ) : error ? (
                    <ErrorMessage message="Failed to load products" />
                  ) : productsData?.products?.length === 0 ? (
                    <Box textAlign="center" py={12}>
                      <Text fontSize="lg" color="gray.600" mb={4}>
                        No products found matching your criteria.
                      </Text>
                      <Button onClick={clearFilters} colorScheme="brand">
                        Clear Filters
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <SimpleGrid
                        columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}
                        spacing={6}
                      >
                        {productsData?.products?.map((product) => (
                          <ProductCard key={product._id} product={product} />
                        ))}
                      </SimpleGrid>
                      <Pagination />
                    </>
                  )}
                </VStack>
              </GridItem>
            </Grid>
          </VStack>
        </Container>
      </Box>

      {/* Mobile Filter Drawer */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="left">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filters</DrawerHeader>
          <DrawerBody>
            <FilterSidebar />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default ProductsPage;
