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
  Icon,
  useToast,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    const result = await registerUser(data);
    if (result.success) {
      navigate("/");
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <>
      <Helmet>
        <title>Register - Koseli Mart</title>
        <meta
          name="description"
          content="Create your Koseli Mart account to start shopping for authentic Nepali products."
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
                  Create Account
                </Heading>
                <Text color="gray.600">
                  Join Koseli Mart and start shopping for authentic Nepali
                  products
                </Text>
              </VStack>

              {/* Registration Form */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack spacing={6} align="stretch">
                  <HStack spacing={4}>
                    <FormControl isInvalid={errors.firstName}>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        placeholder="John"
                        {...register("firstName", {
                          required: "First name is required",
                          minLength: {
                            value: 2,
                            message: "First name must be at least 2 characters",
                          },
                        })}
                      />
                      <FormErrorMessage>
                        {errors.firstName && errors.firstName.message}
                      </FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={errors.lastName}>
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        placeholder="Doe"
                        {...register("lastName", {
                          required: "Last name is required",
                          minLength: {
                            value: 2,
                            message: "Last name must be at least 2 characters",
                          },
                        })}
                      />
                      <FormErrorMessage>
                        {errors.lastName && errors.lastName.message}
                      </FormErrorMessage>
                    </FormControl>
                  </HStack>

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

                  <FormControl isInvalid={errors.phone}>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      {...register("phone", {
                        pattern: {
                          value: /^[\+]?[1-9][\d]{0,15}$/,
                          message: "Invalid phone number",
                        },
                      })}
                    />
                    <FormErrorMessage>
                      {errors.phone && errors.phone.message}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={errors.password}>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      placeholder="Create a strong password"
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters",
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message:
                            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                        },
                      })}
                    />
                    <FormErrorMessage>
                      {errors.password && errors.password.message}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={errors.confirmPassword}>
                    <FormLabel>Confirm Password</FormLabel>
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      {...register("confirmPassword", {
                        required: "Please confirm your password",
                        validate: (value) =>
                          value === password || "Passwords do not match",
                      })}
                    />
                    <FormErrorMessage>
                      {errors.confirmPassword && errors.confirmPassword.message}
                    </FormErrorMessage>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    isLoading={isSubmitting}
                    loadingText="Creating account..."
                    _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
                  >
                    Create Account
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

              {/* Login Link */}
              <HStack justify="center" spacing={1}>
                <Text color="gray.600">Already have an account?</Text>
                <Link
                  as={RouterLink}
                  to="/login"
                  color="brand.500"
                  fontWeight="semibold"
                  _hover={{ textDecoration: "underline" }}
                >
                  Sign in
                </Link>
              </HStack>

              {/* Terms */}
              <Text
                fontSize="xs"
                color="gray.500"
                textAlign="center"
                lineHeight="short"
              >
                By creating an account, you agree to our{" "}
                <Link
                  color="brand.500"
                  _hover={{ textDecoration: "underline" }}
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  color="brand.500"
                  _hover={{ textDecoration: "underline" }}
                >
                  Privacy Policy
                </Link>
              </Text>
            </VStack>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default RegisterPage;





