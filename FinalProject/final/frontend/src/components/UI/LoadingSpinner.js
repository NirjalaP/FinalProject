import React from "react";
import { Spinner, Center, VStack, Text } from "@chakra-ui/react";

const LoadingSpinner = ({ message = "Loading...", size = "xl" }) => {
  return (
    <Center py={8}>
      <VStack spacing={4}>
        <Spinner size={size} color="brand.500" thickness="4px" />
        <Text color="gray.600">{message}</Text>
      </VStack>
    </Center>
  );
};

export default LoadingSpinner;





