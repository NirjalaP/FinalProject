import React, { useState } from "react";
import { AddIcon } from "@chakra-ui/icons";
// Chakra UI Components
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useBreakpointValue,
  Container,
  Link,
} from "@chakra-ui/react";
import { HamburgerIcon, SearchIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { FaShoppingCart, FaUser } from "react-icons/fa";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState("");

  const isMobile = useBreakpointValue({ base: true, lg: false });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Categories", href: "/products" },
    { label: "Contact", href: "/contact" },
  ];

  const NavContent = () => (
    <Flex align="center" justify="space-between" w="full">
      {/* Logo */}
      <Link as={RouterLink} to="/" _hover={{ textDecoration: "none" }}>
        <Text
          fontSize="2xl"
          fontWeight="bold"
          color="brand.600"
          _hover={{ color: "brand.700" }}
        >
          Koseli Mart
        </Text>
      </Link>

      {/* Navigation Links - Desktop */}
      {!isMobile && (
        <HStack spacing={8} flex="1" justify="center">
          {navItems.map((item) => (
            <Link
              key={item.label}
              as={RouterLink}
              to={item.href}
              color={location.pathname === item.href ? "brand.600" : "gray.600"}
              fontWeight={
                location.pathname === item.href ? "semibold" : "medium"
              }
              _hover={{ color: "brand.600" }}
            >
              {item.label}
            </Link>
          ))}
        </HStack>
      )}

      {/* Search Bar */}
      {!isMobile && (
        <Box flex="1" maxW="400px" mx={4}>
          <form onSubmit={handleSearch}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="white"
                borderColor="gray.200"
                _focus={{ borderColor: "brand.500" }}
              />
            </InputGroup>
          </form>
        </Box>
      )}

      {/* Right Side Actions */}
      <HStack spacing={4}>
        {/* Cart */}
        <Button
          as={RouterLink}
          to="/cart"
          variant="ghost"
          size="sm"
          position="relative"
          _hover={{ bg: "gray.100" }}
        >
          <FaShoppingCart />
          {totalItems > 0 && (
            <Badge
              position="absolute"
              top="-1"
              right="-1"
              colorScheme="red"
              borderRadius="full"
              fontSize="xs"
              minW="20px"
              h="20px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {totalItems}
            </Badge>
          )}
        </Button>

        {/* User Menu */}
        {isAuthenticated ? (
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              size="sm"
              leftIcon={<Avatar size="xs" src={user?.profilePicture} />}
              rightIcon={<ChevronDownIcon />}
              _hover={{ bg: "gray.100" }}
            >
              {user?.firstName}
            </MenuButton>
            <MenuList>
              <MenuItem as={RouterLink} to="/profile">
                <FaUser mr={2} />
                Profile
              </MenuItem>
              <MenuItem as={RouterLink} to="/orders">
                Orders
              </MenuItem>
              {user?.role === "admin" && (
                <>
                  <MenuDivider />
                  <MenuItem as={RouterLink} to="/admin">
                    Admin Dashboard
                  </MenuItem>
                </>
              )}
              <MenuDivider />
              <MenuItem onClick={handleLogout} color="red.500">
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <HStack spacing={2}>
            <Button
              as={RouterLink}
              to="/login"
              variant="ghost"
              size="sm"
              _hover={{ bg: "gray.100" }}
            >
              Login
            </Button>
            <Button
              as={RouterLink}
              to="/register"
              colorScheme="brand"
              size="sm"
            >
              Sign Up
            </Button>
          </HStack>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            icon={<HamburgerIcon />}
            variant="ghost"
            size="sm"
            onClick={onOpen}
            aria-label="Open menu"
          />
        )}
      </HStack>
    </Flex>
  );

  return (
    <>
      <Box bg="white" shadow="sm" position="sticky" top={0} zIndex={1000}>
        <Container maxW="7xl">
          <NavContent />
        </Container>
      </Box>

      {/* Mobile Menu Drawer */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="left">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <Text fontSize="xl" fontWeight="bold" color="brand.600">
              Koseli Mart
            </Text>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch" mt={4}>
              {/* Mobile Search */}
              <Box>
                <form onSubmit={handleSearch}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </InputGroup>
                </form>
              </Box>

              {/* Mobile Navigation */}
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  as={RouterLink}
                  to={item.href}
                  variant="ghost"
                  justifyContent="flex-start"
                  onClick={onClose}
                  color={
                    location.pathname === item.href ? "brand.600" : "gray.600"
                  }
                >
                  {item.label}
                </Button>
              ))}

              {!isAuthenticated && (
                <>
                  <MenuDivider />
                  <Button
                    as={RouterLink}
                    to="/login"
                    variant="outline"
                    onClick={onClose}
                  >
                    Login
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/register"
                    colorScheme="brand"
                    onClick={onClose}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Navbar;
