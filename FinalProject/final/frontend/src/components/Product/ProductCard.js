import React from "react";
import {
  Card,
  CardBody,
  CardFooter,
  Image,
  Stack,
  Heading,
  Text,
  Badge,
  Button,
  HStack,
  VStack,
  Box,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FaShoppingCart, FaStar } from "react-icons/fa";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { resolveImageUrl } from "../../utils/image";

const ProductCard = ({ product, showAddToCart = true }) => {
  const { addToCart, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const cardBg = useColorModeValue("white", "gray.800");

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return;
    }

    await addToCart(product._id, 1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getStockStatus = () => {
    if (!product.stock?.trackInventory)
      return { status: "Available", color: "green" };
    if (product.stock.quantity === 0)
      return { status: "Out of Stock", color: "red" };
    if (product.stock.quantity <= product.stock.lowStockThreshold) {
      return { status: "Low Stock", color: "orange" };
    }
    return { status: "In Stock", color: "green" };
  };

  const stockStatus = getStockStatus();
  const isOutOfStock =
    product.stock?.trackInventory && product.stock.quantity === 0;

  return (
    <Card
      as={RouterLink}
      to={`/product/${product.slug}`}
      variant="unstyled"
      bg={cardBg}
      boxShadow="sm"
      borderRadius="xl"
      overflow="hidden"
      cursor="pointer"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "lg",
        transition: "all 0.3s",
      }}
      position="relative"
    >
      {/* Product Image */}
      <Box position="relative" overflow="hidden">
        <Image
          src={resolveImageUrl(
            product.images?.[0]?.urlMedium || // Use medium size by default
              product.images?.[0]?.url || // Fallback to original if no optimized version
              `/assets/products/medium/${product.slug}.jpg` || // Try medium from file system
              `/assets/products/${product.slug}.jpg` || // Try original from file system
              "/placeholder-product.jpg"
          )}
          alt={product.name}
          objectFit="cover"
          h="200px"
          w="100%"
          fallbackSrc="/assets/products/default-product.jpg"
        />

        {/* Stock Status Badge */}
        <Badge
          position="absolute"
          top={2}
          right={2}
          colorScheme={stockStatus.color}
          variant="solid"
          fontSize="xs"
        >
          {stockStatus.status}
        </Badge>

        {/* Discount Badge */}
        {product.comparePrice && product.comparePrice > product.price && (
          <Badge
            position="absolute"
            top={2}
            left={2}
            colorScheme="red"
            variant="solid"
            fontSize="xs"
          >
            {Math.round(
              ((product.comparePrice - product.price) / product.comparePrice) *
                100
            )}
            % OFF
          </Badge>
        )}

        {/* Featured Badge */}
        {product.isFeatured && (
          <Badge
            position="absolute"
            bottom={2}
            left={2}
            colorScheme="purple"
            variant="solid"
            fontSize="xs"
          >
            Featured
          </Badge>
        )}
      </Box>

      <CardBody p={4}>
        <Stack spacing={3}>
          {/* Category */}
          {product.category && (
            <Text fontSize="sm" color="brand.600" fontWeight="medium">
              {product.category.name}
            </Text>
          )}

          {/* Product Name */}
          <Heading size="sm" noOfLines={2} color="gray.700">
            {product.name}
          </Heading>

          {/* Nepali Name */}
          {product.nepaliName && (
            <Text fontSize="sm" color="gray.500" fontStyle="italic">
              {product.nepaliName}
            </Text>
          )}

          {/* Description */}
          {product.shortDescription && (
            <Text fontSize="sm" color="gray.600" noOfLines={2}>
              {product.shortDescription}
            </Text>
          )}

          {/* Rating */}
          {product.rating > 0 && (
            <HStack spacing={1}>
              <Icon as={FaStar} color="yellow.400" w={4} h={4} />
              <Text fontSize="sm" color="gray.600">
                {product.rating.toFixed(1)} ({product.numReviews} reviews)
              </Text>
            </HStack>
          )}

          {/* Price */}
          <HStack spacing={2} align="baseline">
            <Text fontSize="lg" fontWeight="bold" color="brand.600">
              {formatPrice(product.price)}
            </Text>
            {product.comparePrice && product.comparePrice > product.price && (
              <Text
                fontSize="sm"
                color="gray.500"
                textDecoration="line-through"
              >
                {formatPrice(product.comparePrice)}
              </Text>
            )}
          </HStack>
        </Stack>
      </CardBody>

      {showAddToCart && (
        <CardFooter pt={0} px={4} pb={4}>
          <Button
            leftIcon={<FaShoppingCart />}
            colorScheme="brand"
            size="sm"
            w="full"
            isDisabled={isOutOfStock || isLoading}
            isLoading={isLoading}
            onClick={handleAddToCart}
            _hover={{
              transform: "translateY(-1px)",
              boxShadow: "md",
            }}
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ProductCard;





