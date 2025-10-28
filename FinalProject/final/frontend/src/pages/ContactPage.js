import React from "react";
import { Helmet } from "react-helmet-async";
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Icon,
  useToast,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from "react-icons/fa";
import api from "../config/axios";

const ContactPage = () => {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      // In a real app, you would send this to your backend
      console.log("Contact form data:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Message sent successfully!",
        description: "We will get back to you within 24 hours.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      reset();
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const contactInfo = [
    {
      icon: FaMapMarkerAlt,
      title: "Address",
      details: ["12345 Pioneer Blvd", "Artesia, CA 90701", "United States"],
    },
    {
      icon: FaPhone,
      title: "Phone",
      details: ["(562) 123-4567", "(562) 123-4568"],
    },
    {
      icon: FaEnvelope,
      title: "Email",
      details: ["info@koselimart.com", "orders@koselimart.com"],
    },
    {
      icon: FaClock,
      title: "Store Hours",
      details: [
        "Monday - Friday: 9:00 AM - 9:00 PM",
        "Saturday: 9:00 AM - 10:00 PM",
        "Sunday: 10:00 AM - 8:00 PM",
      ],
    },
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us - Koseli Mart</title>
        <meta
          name="description"
          content="Get in touch with Koseli Mart. Visit our store in Artesia or contact us online."
        />
      </Helmet>

      <Box py={16}>
        <Container maxW="7xl">
          <VStack spacing={16} align="stretch">
            {/* Header */}
            <VStack spacing={4} textAlign="center">
              <Heading as="h1" fontSize="4xl" fontWeight="bold">
                Contact Us
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl">
                We'd love to hear from you. Send us a message and we'll respond
                as soon as possible.
              </Text>
            </VStack>

            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={12}>
              {/* Contact Form */}
              <GridItem>
                <Box
                  p={8}
                  bg="white"
                  borderRadius="xl"
                  boxShadow="lg"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <VStack spacing={6} align="stretch">
                    <Heading as="h2" fontSize="2xl" fontWeight="semibold">
                      Send us a Message
                    </Heading>

                    <form onSubmit={handleSubmit(onSubmit)}>
                      <VStack spacing={6} align="stretch">
                        <Grid
                          templateColumns={{ base: "1fr", sm: "1fr 1fr" }}
                          gap={4}
                        >
                          <FormControl isInvalid={errors.firstName}>
                            <FormLabel>First Name</FormLabel>
                            <Input
                              placeholder="Your first name"
                              {...register("firstName", {
                                required: "First name is required",
                                minLength: {
                                  value: 2,
                                  message:
                                    "First name must be at least 2 characters",
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
                              placeholder="Your last name"
                              {...register("lastName", {
                                required: "Last name is required",
                                minLength: {
                                  value: 2,
                                  message:
                                    "Last name must be at least 2 characters",
                                },
                              })}
                            />
                            <FormErrorMessage>
                              {errors.lastName && errors.lastName.message}
                            </FormErrorMessage>
                          </FormControl>
                        </Grid>

                        <FormControl isInvalid={errors.email}>
                          <FormLabel>Email</FormLabel>
                          <Input
                            type="email"
                            placeholder="your.email@example.com"
                            {...register("email", {
                              required: "Email is required",
                              pattern: {
                                value:
                                  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid email address",
                              },
                            })}
                          />
                          <FormErrorMessage>
                            {errors.email && errors.email.message}
                          </FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={errors.phone}>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <Input
                            type="tel"
                            placeholder="(555) 123-4567"
                            {...register("phone")}
                          />
                          <FormErrorMessage>
                            {errors.phone && errors.phone.message}
                          </FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={errors.subject}>
                          <FormLabel>Subject</FormLabel>
                          <Input
                            placeholder="What is this about?"
                            {...register("subject", {
                              required: "Subject is required",
                              minLength: {
                                value: 5,
                                message:
                                  "Subject must be at least 5 characters",
                              },
                            })}
                          />
                          <FormErrorMessage>
                            {errors.subject && errors.subject.message}
                          </FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={errors.message}>
                          <FormLabel>Message</FormLabel>
                          <Textarea
                            placeholder="Tell us how we can help you..."
                            rows={6}
                            {...register("message", {
                              required: "Message is required",
                              minLength: {
                                value: 10,
                                message:
                                  "Message must be at least 10 characters",
                              },
                            })}
                          />
                          <FormErrorMessage>
                            {errors.message && errors.message.message}
                          </FormErrorMessage>
                        </FormControl>

                        <Button
                          type="submit"
                          colorScheme="brand"
                          size="lg"
                          isLoading={isSubmitting}
                          loadingText="Sending..."
                          _hover={{
                            transform: "translateY(-1px)",
                            boxShadow: "lg",
                          }}
                        >
                          Send Message
                        </Button>
                      </VStack>
                    </form>
                  </VStack>
                </Box>
              </GridItem>

              {/* Contact Information */}
              <GridItem>
                <VStack spacing={8} align="stretch">
                  <Box>
                    <Heading
                      as="h2"
                      fontSize="2xl"
                      fontWeight="semibold"
                      mb={6}
                    >
                      Get in Touch
                    </Heading>
                    <Text fontSize="lg" color="gray.600" lineHeight="tall">
                      We're here to help! Whether you have questions about our
                      products, need assistance with an order, or want to learn
                      more about Nepali cuisine, don't hesitate to reach out.
                    </Text>
                  </Box>

                  <VStack spacing={6} align="stretch">
                    {contactInfo.map((info, index) => (
                      <Box key={index}>
                        <HStack spacing={4} align="start">
                          <Icon
                            as={info.icon}
                            w={6}
                            h={6}
                            color="brand.500"
                            mt={1}
                          />
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold" fontSize="lg">
                              {info.title}
                            </Text>
                            {info.details.map((detail, detailIndex) => (
                              <Text key={detailIndex} color="gray.600">
                                {detail}
                              </Text>
                            ))}
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>

                  {/* Map Placeholder */}
                  <Box
                    h="300px"
                    bg="gray.100"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    border="2px dashed"
                    borderColor="gray.300"
                  >
                    <VStack spacing={2}>
                      <Icon as={FaMapMarkerAlt} w={8} h={8} color="gray.400" />
                      <Text color="gray.500" textAlign="center">
                        Interactive Map
                        <br />
                        <Text fontSize="sm">
                          12345 Pioneer Blvd, Artesia, CA 90701
                        </Text>
                      </Text>
                    </VStack>
                  </Box>
                </VStack>
              </GridItem>
            </Grid>

            {/* FAQ Section */}
            <Box p={8} bg="gray.50" borderRadius="xl" textAlign="center">
              <VStack spacing={6}>
                <Heading as="h2" fontSize="2xl" fontWeight="semibold">
                  Frequently Asked Questions
                </Heading>
                <Text fontSize="lg" color="gray.600" maxW="3xl">
                  Can't find what you're looking for? Check out our FAQ section
                  or send us a message using the form above.
                </Text>
                <Button
                  colorScheme="brand"
                  variant="outline"
                  size="lg"
                  _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
                >
                  View FAQ
                </Button>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default ContactPage;
