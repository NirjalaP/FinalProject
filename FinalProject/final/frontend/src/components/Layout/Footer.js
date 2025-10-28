import React from "react";
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Link,
  IconButton,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";

const Footer = () => {
  const bgColor = useColorModeValue("gray.900", "gray.800");
  const textColor = useColorModeValue("gray.300", "gray.400");

  const footerLinks = {
    "Quick Links": [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: "Categories", href: "/products" },
      { label: "About Us", href: "/about" },
    ],
    "Customer Service": [
      { label: "Contact Us", href: "/contact" },
      { label: "Shipping Info", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "FAQ", href: "/faq" },
    ],
    "My Account": [
      { label: "Login", href: "/login" },
      { label: "Register", href: "/register" },
      { label: "My Orders", href: "/orders" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  };

  const socialLinks = [
    {
      icon: FaFacebook,
      href: "https://facebook.com/koselimart",
      label: "Facebook",
    },
    {
      icon: FaInstagram,
      href: "https://instagram.com/koselimart",
      label: "Instagram",
    },
    {
      icon: FaTwitter,
      href: "https://twitter.com/koselimart",
      label: "Twitter",
    },
    {
      icon: FaYoutube,
      href: "https://youtube.com/koselimart",
      label: "YouTube",
    },
  ];

  return (
    <Box bg={bgColor} color={textColor} mt="auto">
      <Container maxW="7xl" py={12}>
        <Grid templateColumns={{ base: "1fr", md: "2fr 1fr 1fr 1fr" }} gap={8}>
          {/* Company Info */}
          <GridItem>
            <VStack align="start" spacing={4}>
              <Text fontSize="2xl" fontWeight="bold" color="white">
                Koseli Mart
              </Text>
              <Text fontSize="sm" lineHeight="tall">
                Your trusted source for authentic Nepali groceries in Artesia.
                We bring the flavors of Nepal to your doorstep with fresh,
                traditional ingredients and products.
              </Text>
              <HStack spacing={4}>
                {socialLinks.map((social) => (
                  <IconButton
                    key={social.label}
                    as="a"
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={<social.icon />}
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "white", bg: "gray.700" }}
                    aria-label={social.label}
                  />
                ))}
              </HStack>
            </VStack>
          </GridItem>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <GridItem key={title}>
              <VStack align="start" spacing={4}>
                <Text fontSize="lg" fontWeight="semibold" color="white">
                  {title}
                </Text>
                {links.map((link) => (
                  <Link
                    key={link.label}
                    as={RouterLink}
                    to={link.href}
                    fontSize="sm"
                    _hover={{ color: "white", textDecoration: "underline" }}
                  >
                    {link.label}
                  </Link>
                ))}
              </VStack>
            </GridItem>
          ))}
        </Grid>

        <Divider my={8} borderColor="gray.600" />

        {/* Bottom Section */}
        <Grid
          templateColumns={{ base: "1fr", md: "1fr auto" }}
          gap={4}
          alignItems="center"
        >
          <VStack align={{ base: "center", md: "start" }} spacing={2}>
            <Text fontSize="sm">© 2024 Koseli Mart. All rights reserved.</Text>
            <Text fontSize="xs" color="gray.500">
              12345 Pioneer Blvd, Artesia, CA 90701 | Phone: (562) 123-4567
            </Text>
          </VStack>

          <HStack spacing={6}>
            <Link fontSize="sm" _hover={{ textDecoration: "underline" }}>
              Privacy Policy
            </Link>
            <Link fontSize="sm" _hover={{ textDecoration: "underline" }}>
              Terms of Service
            </Link>
          </HStack>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;





