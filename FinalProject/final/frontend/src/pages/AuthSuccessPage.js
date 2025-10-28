import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Box,
  Container,
  VStack,
  Text,
  Button,
  Spinner,
  Center,
  Heading,
  Icon,
  useToast,
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const AuthSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { setAuthToken } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      toast({
        title: "Welcome to Koseli Mart!",
        description: "You have been successfully logged in.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } else {
      // No token found, redirect to login
      navigate("/login", { replace: true });
    }
  }, [token, setAuthToken, navigate, toast]);

  if (!token) {
    return (
      <Center minH="50vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return (
    <>
      <Helmet>
        <title>Authentication Success - Koseli Mart</title>
      </Helmet>

      <Box py={16} minH="80vh" display="flex" alignItems="center">
        <Container maxW="md">
          <VStack spacing={8} textAlign="center">
            <Icon as={FaCheckCircle} w={20} h={20} color="green.500" />

            <VStack spacing={4}>
              <Heading
                as="h1"
                fontSize="3xl"
                fontWeight="bold"
                color="green.600"
              >
                Welcome to Koseli Mart!
              </Heading>
              <Text fontSize="lg" color="gray.600">
                You have been successfully logged in. Redirecting you to the
                home page...
              </Text>
            </VStack>

            <Spinner size="lg" color="brand.500" />
          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default AuthSuccessPage;





