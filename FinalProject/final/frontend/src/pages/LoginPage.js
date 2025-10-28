import React from "react";
import { Helmet } from "react-helmet-async";
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Divider,
  Link,
  useToast,
  Icon,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = location.state?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <>
      <Helmet>
        <title>Login - Koseli Mart</title>
        <meta
          name="description"
          content="Login to your Koseli Mart account to access your orders and personalized shopping experience."
        />
      </Helmet>

      <Box py={16} minH="80vh" display="flex" alignItems="center">
        <Container maxW="md">
          <Box
            p={8}
            bg="white"
            borderRadius="xl"
            boxShadow="lg"
            border="1px solid"
            borderColor="gray.200"
          >
            <VStack spacing={8} align="stretch">
              {/* Header */}
              <VStack spacing={4} textAlign="center">
                <Heading
                  as="h1"
                  fontSize="3xl"
                  fontWeight="bold"
                  color="brand.600"
                >
                  Welcome Back
                </Heading>
                <Text color="gray.600">
                  Sign in to your Koseli Mart account
                </Text>
              </VStack>

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack spacing={6} align="stretch">
                  <FormControl isInvalid={errors.email}>
                    <FormLabel>Email Address</FormLabel>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                    />
                    <FormErrorMessage>
                      {errors.email && errors.email.message}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={errors.password}>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters",
                        },
                      })}
                    />
                    <FormErrorMessage>
                      {errors.password && errors.password.message}
                    </FormErrorMessage>
                  </FormControl>

                  <HStack justify="space-between" align="center">
                    <Link
                      as={RouterLink}
                      to="/forgot-password"
                      color="brand.500"
                      fontSize="sm"
                      _hover={{ textDecoration: "underline" }}
                    >
                      Forgot password?
                    </Link>
                  </HStack>

                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    isLoading={isSubmitting}
                    loadingText="Signing in..."
                    _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>

              {/* Divider */}
              <HStack>
                <Divider />
                <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
                  or continue with
                </Text>
                <Divider />
              </HStack>

              {/* OAuth Buttons */}
              <VStack spacing={3}>
                <Button
                  w="full"
                  variant="outline"
                  leftIcon={<Icon as={FaGoogle} color="red.500" />}
                  onClick={() => handleOAuthLogin("google")}
                  _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
                >
                  Continue with Google
                </Button>

                <Button
                  w="full"
                  variant="outline"
                  leftIcon={<Icon as={FaFacebook} color="blue.500" />}
                  onClick={() => handleOAuthLogin("facebook")}
                  _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
                >
                  Continue with Facebook
                </Button>
              </VStack>

              {/* Sign Up Link */}
              <HStack justify="center" spacing={1}>
                <Text color="gray.600">Don't have an account?</Text>
                <Link
                  as={RouterLink}
                  to="/register"
                  color="brand.500"
                  fontWeight="semibold"
                  _hover={{ textDecoration: "underline" }}
                >
                  Sign up
                </Link>
              </HStack>
            </VStack>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default LoginPage;





