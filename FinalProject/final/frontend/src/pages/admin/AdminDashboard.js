import React from "react";
import { useQuery } from "react-query";
import {
  Box,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Button,
  VStack,
  HStack,
  Spinner,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import api from "../../config/axios";

const AdminDashboard = () => {
  const { data, isLoading, error } = useQuery("admin-dashboard", () =>
    api.get("/admin/dashboard").then((r) => r.data)
  );

  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={8}>
        <Text color="red.500">Failed to load dashboard data.</Text>
      </Box>
    );
  }

  const overview = data?.overview || {};

  return (
    <Box p={8}>
      <VStack align="stretch" spacing={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Admin Dashboard
        </Text>

        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Stat bg="white" p={4} rounded="md" boxShadow="sm">
            <StatLabel>Orders</StatLabel>
            <StatNumber>{overview.orders?.total || 0}</StatNumber>
          </Stat>
          <Stat bg="white" p={4} rounded="md" boxShadow="sm">
            <StatLabel>Products</StatLabel>
            <StatNumber>{overview.products?.totalProducts || 0}</StatNumber>
          </Stat>
          <Stat bg="white" p={4} rounded="md" boxShadow="sm">
            <StatLabel>Users</StatLabel>
            <StatNumber>{overview.users?.totalUsers || 0}</StatNumber>
          </Stat>
          <Stat bg="white" p={4} rounded="md" boxShadow="sm">
            <StatLabel>Categories</StatLabel>
            <StatNumber>{overview.categories || 0}</StatNumber>
          </Stat>
        </SimpleGrid>

        <HStack spacing={4}>
          <Button as={RouterLink} to="/admin/products" colorScheme="brand">
            Manage Products
          </Button>
          <Button as={RouterLink} to="/admin/categories" variant="outline">
            Manage Categories
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default AdminDashboard;
