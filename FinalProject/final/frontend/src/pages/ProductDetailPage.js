import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Box,
  Container,
  Grid,
  GridItem,
  Image,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  NumberInput,
  NumberInputField,
  Tag,
  Stack,
  Divider,
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { useQuery } from "react-query";
import api from "../config/axios";
import { useCart } from "../contexts/CartContext";
import ProductCard from "../components/Product/ProductCard";
import { resolveImageUrl } from "../utils/image";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

const ProductDetailPage = () => {
  const { id } = useParams();
  const { addToCart, isLoading: cartLoading } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(null);

  const {
    data,
    isLoading,
    error,
  } = useQuery(["product", id], () => api.get(`/products/${id}`).then((r) => r.data.product), {
    retry: 1,
  });

  // Related products (same category)
  const categoryId = data?.category?._id;
  const { data: relatedData } = useQuery(
    ["related", categoryId],
    () => api.get(`/products?category=${categoryId}&limit=4`).then((r) => r.data.products),
    { enabled: !!categoryId }
  );

  const product = data;

  React.useEffect(() => {
    if (product) {
      // Use large version for main display, fallback to original
      const url = product.images?.[0]?.urlLarge || 
                 product.images?.[0]?.url || 
                 `/assets/products/large/${product.slug}.jpg` ||
                 `/assets/products/${product.slug}.jpg` ||
                 "/assets/products/default-product.jpg";
      setMainImage(url);
    }
  }, [product]);

  const handleAdd = async () => {
    await addToCart(product._id, Number(quantity));
  };

  if (isLoading) {
    return (
      <Box py={16} textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box p={8} textAlign="center">
        <Text>Product not found or failed to load.</Text>
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product.name} - Koseli Mart</title>
        <meta name="description" content={product.shortDescription || product.description || ""} />
      </Helmet>

      <Box py={8}>
        <Container maxW="6xl">
          <Grid templateColumns={{ base: "1fr", md: "1fr 420px" }} gap={8}>
            <GridItem>
              <VStack align="stretch" spacing={4}>
                <Image 
                  src={resolveImageUrl(mainImage)} 
                  alt={product.name} 
                  w="100%" 
                  maxH="560px" 
                  objectFit="contain"
                  fallbackSrc="/assets/products/default-product.jpg"
                />

                <HStack spacing={3} flexWrap="wrap">
                  {(product.images || []).map((img, idx) => (
                    <Image
                      key={idx}
                      src={resolveImageUrl(img.urlThumb || img.url || "/assets/products/default-product.jpg")}
                      alt={img.alt || product.name}
                      boxSize="80px"
                      objectFit="cover"
                      borderRadius="md"
                      cursor="pointer"
                      onClick={() => setMainImage(img.urlLarge || img.url || "/assets/products/default-product.jpg")}
                    />
                  ))}
                </HStack>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg">
                    {product.name}
                  </Heading>
                  {product.nepaliName && (
                    <Text fontStyle="italic" color="gray.600">{product.nepaliName}</Text>
                  )}
                </Box>

                <Stack direction={{ base: "column", md: "row" }} align="center" justify="space-between">
                  <HStack spacing={4} align="center">
                    <Text fontSize="2xl" fontWeight="bold" color="brand.600">{formatPrice(product.price)}</Text>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <Text textDecoration="line-through" color="gray.500">{formatPrice(product.comparePrice)}</Text>
                    )}
                    {product.isFeatured && <Tag colorScheme="purple">Featured</Tag>}
                  </HStack>

                </Stack>

                <Box>
                  <Text>{product.description}</Text>
                </Box>
              </VStack>
            </GridItem>

            <GridItem>
              <Box position="sticky" top="100px" bg="white" p={6} rounded="xl" boxShadow="sm">
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Availability</Text>
                    <Text>{product.stock?.trackInventory ? (product.stock.quantity > 0 ? `${product.stock.quantity} in stock` : "Out of stock") : "Available"}</Text>
                  </HStack>

                  <HStack>
                    <Text>Quantity</Text>
                    <NumberInput size="sm" maxW="120px" value={quantity} min={1} onChange={(val) => setQuantity(val)}>
                      <NumberInputField />
                    </NumberInput>
                  </HStack>

                  <Button colorScheme="brand" size="lg" isLoading={cartLoading} onClick={handleAdd} isDisabled={product.stock?.trackInventory && product.stock.quantity === 0}>
                    Add to Cart
                  </Button>

                  <Box>
                    <Text fontWeight="semibold" mb={2}>Category</Text>
                    {product.category ? (
                      <Button as={RouterLink} to={`/category/${product.category.slug}`} size="sm" variant="outline">{product.category.name}</Button>
                    ) : null}
                  </Box>
                </VStack>
              </Box>
            </GridItem>
          </Grid>

          {/* Related products */}
          {relatedData?.length > 0 && (
            <Box mt={12}>
              <Heading as="h3" size="md" mb={4}>Related products</Heading>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
                {relatedData.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </SimpleGrid>
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
};

export default ProductDetailPage;
