import React from "react";
import { Box, Text } from "@chakra-ui/react";

const OrderDetailPage = () => {
  return (
    <Box p={8}>
      <Text fontSize="2xl" fontWeight="bold">
        Order Details
      </Text>
      <Text>This page will show detailed order information.</Text>
    </Box>
  );
};

export default OrderDetailPage;
