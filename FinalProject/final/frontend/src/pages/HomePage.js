import React from "react";
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
  Image,
  Badge,
  Card,
  CardBody,
  CardFooter,
  SimpleGrid,
  Heading,
  Flex,
  Icon,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "react-query";
import api from "../config/axios";
import {
  FaShoppingCart,
  FaStar,
  FaTruck,
  FaShieldAlt,
  FaHeadset,
} from "react-icons/fa";

import ProductCard from "../components/Product/ProductCard";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import ErrorMessage from "../components/UI/ErrorMessage";

const HomePage = () => {
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Fetch featured products
  const {
    data: featuredProducts,
    isLoading: featuredLoading,
    error: featuredError,
  } = useQuery("featured-products", () =>
    api.get("/products/featured/list?limit=8").then((res) => res.data.products)
  );

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery(
    "categories",
    () => api.get("/categories").then((res) => res.data.categories)
  );

  const features = [
    {
      icon: FaTruck,
      title: "Free Delivery",
      description: "Free delivery on orders over $50",
    },
    {
      icon: FaShieldAlt,
      title: "Secure Payment",
      description: "100% secure payment with Stripe",
    },
    {
      icon: FaHeadset,
      title: "24/7 Support",
      description: "Round the clock customer support",
    },
  ];

  const heroImage =
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";

  return (
    <>
      <Helmet>
        <title>Koseli Mart - Authentic Nepali Groceries in Artesia</title>
        <meta
          name="description"
          content="Your trusted source for authentic Nepali groceries in Artesia. Fresh ingredients, traditional flavors, and quality products delivered to your doorstep."
        />
      </Helmet>

      {/* Hero Section */}
      <Box
        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        color="white"
        py={20}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="7xl" position="relative" zIndex={2}>
          <Grid
            templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
            gap={12}
            alignItems="center"
          >
            <GridItem>
              <VStack align="start" spacing={6}>
                <Badge colorScheme="yellow" px={3} py={1} borderRadius="full">
                  Authentic Nepali Products
                </Badge>

                <Heading
                  as="h1"
                  fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                  fontWeight="bold"
                  lineHeight="shorter"
                >
                  Welcome to{" "}
                  <Text as="span" color="yellow.300">
                    Koseli Mart
                  </Text>
                </Heading>

                <Text fontSize="xl" color="gray.100" lineHeight="tall">
                  Your trusted source for authentic Nepali groceries in Artesia.
                  We bring the flavors of Nepal to your doorstep with fresh,
                  traditional ingredients and products.
                </Text>

                <HStack spacing={4} wrap="wrap">
                  <Button
                    as={RouterLink}
                    to="/products"
                    size="lg"
                    colorScheme="yellow"
                    leftIcon={<FaShoppingCart />}
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                  >
                    Shop Now
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/contact"
                    size="lg"
                    variant="outline"
                    color="white"
                    borderColor="white"
                    _hover={{ bg: "white", color: "brand.600" }}
                  >
                    Contact Us
                  </Button>
                </HStack>
              </VStack>
            </GridItem>

            <GridItem display={{ base: "none", lg: "block" }}>
              <Box position="relative">
                <Image
                  src={heroImage}
                  alt="Nepali Groceries"
                  borderRadius="xl"
                  boxShadow="2xl"
                  transform="rotate(3deg)"
                />
                <Box
                  position="absolute"
                  top="-10px"
                  right="-10px"
                  bg="yellow.400"
                  color="gray.800"
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="bold"
                  transform="rotate(12deg)"
                >
                  Fresh & Authentic
                </Box>
              </Box>
            </GridItem>
          </Grid>
        </Container>

        {/* Background decoration */}
        <Box
          position="absolute"
          top="0"
          right="0"
          w="50%"
          h="100%"
          bg="rgba(255,255,255,0.1)"
          transform="skewX(-15deg)"
          transformOrigin="top right"
        />
      </Box>

      {/* Features Section */}
      <Box py={16} bg="gray.50">
        <Container maxW="7xl">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            {features.map((feature, index) => (
              <Card
                key={index}
                textAlign="center"
                variant="unstyled"
                bg="white"
              >
                <CardBody>
                  <VStack spacing={4}>
                    <Icon as={feature.icon} w={12} h={12} color="brand.500" />
                    <Text fontSize="lg" fontWeight="semibold">
                      {feature.title}
                    </Text>
                    <Text color="gray.600">{feature.description}</Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Categories Section */}
      <Box py={16}>
        <Container maxW="7xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading as="h2" fontSize="3xl" fontWeight="bold">
                Shop by Category
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl">
                Discover our wide range of authentic Nepali products organized
                by categories
              </Text>
            </VStack>

            {categoriesLoading ? (
              <LoadingSpinner />
            ) : (
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6} w="full">
                {categories?.slice(0, 8).map((category) => (
                  <Card
                    key={category._id}
                    as={RouterLink}
                    to={`/category/${category.slug}`}
                    variant="unstyled"
                    cursor="pointer"
                    _hover={{ transform: "translateY(-4px)", boxShadow: "lg" }}
                    transition="all 0.3s"
                    bg="white"
                    overflow="hidden"
                  >
                    <CardBody p={6} textAlign="center">
                      <VStack spacing={4}>
                        <Box
                          w={16}
                          h={16}
                          bg="brand.100"
                          borderRadius="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text fontSize="2xl">🥘</Text>
                        </Box>
                        <Text fontWeight="semibold">{category.name}</Text>
                        {category.nepaliName && (
                          <Text fontSize="sm" color="gray.600">
                            {category.nepaliName}
                          </Text>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </VStack>
        </Container>
      </Box>

      {/* Featured Products Section */}
      <Box py={16} bg="gray.50">
        <Container maxW="7xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading as="h2" fontSize="3xl" fontWeight="bold">
                Featured Products
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl">
                Handpicked authentic Nepali products that our customers love
              </Text>
            </VStack>

            {featuredLoading ? (
              <LoadingSpinner />
            ) : featuredError ? (
              <ErrorMessage message="Failed to load featured products" />
            ) : (
              <SimpleGrid
                columns={{ base: 1, sm: 2, lg: 4 }}
                spacing={6}
                w="full"
              >
                {featuredProducts?.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </SimpleGrid>
            )}

            <Button
              as={RouterLink}
              to="/products"
              size="lg"
              colorScheme="brand"
              variant="outline"
            >
              View All Products
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* About Section */}
      <Box py={16}>
        <Container maxW="7xl">
          <Grid
            templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
            gap={12}
            alignItems="center"
          >
            <GridItem>
              <VStack align="start" spacing={6}>
                <Heading as="h2" fontSize="3xl" fontWeight="bold">
                  Why Choose Koseli Mart?
                </Heading>
                <Text fontSize="lg" color="gray.600" lineHeight="tall">
                  We are passionate about bringing authentic Nepali flavors to
                  your home. Our carefully curated selection includes fresh
                  spices, traditional ingredients, and specialty items that you
                  won't find anywhere else in Artesia.
                </Text>
                <VStack align="start" spacing={4} w="full">
                  {[
                    "100% Authentic Nepali Products",
                    "Fresh & Quality Guaranteed",
                    "Fast & Reliable Delivery",
                    "Competitive Prices",
                    "Excellent Customer Service",
                  ].map((item, index) => (
                    <HStack key={index} spacing={3}>
                      <Icon as={FaStar} color="yellow.400" />
                      <Text>{item}</Text>
                    </HStack>
                  ))}
                </VStack>
                <Button
                  as={RouterLink}
                  to="/contact"
                  size="lg"
                  colorScheme="brand"
                >
                  Learn More About Us
                </Button>
              </VStack>
            </GridItem>

            <GridItem>
              <Image
                src="https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Nepali spices and ingredients"
                borderRadius="xl"
                boxShadow="lg"
              />
            </GridItem>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default HomePage;
