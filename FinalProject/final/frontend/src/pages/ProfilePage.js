import React from "react";
import { Box, Text } from "@chakra-ui/react";

const ProfilePage = () => {
  return (
    <Box p={8}>
      <Text fontSize="2xl" fontWeight="bold">
        User Profile
      </Text>
      <Text>This page will show user profile information.</Text>
    </Box>
  );
};

export default ProfilePage;
