import React from "react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
} from "@chakra-ui/react";

const ErrorMessage = ({
  message = "Something went wrong",
  title = "Error",
}) => {
  return (
    <Box py={8}>
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Box>
      </Alert>
    </Box>
  );
};

export default ErrorMessage;





