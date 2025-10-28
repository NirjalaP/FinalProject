import React from "react";
import { Box, Text } from "@chakra-ui/react";

const OrdersPage = () => {
  return (
    <Box p={8}>
      <Text fontSize="2xl" fontWeight="bold">
        My Orders
      </Text>
      <Text>This page will show user's order history.</Text>
    </Box>
  );
};

export default OrdersPage;
