import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  Button,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  FormControl,
  FormLabel,
  Input,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch,
  NumberInput,
  NumberInputField,
  IconButton,
  HStack,
  Image,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  Spacer,
  Textarea,
  Tag,
  TagLabel
} from "@chakra-ui/react";
import { 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  SearchIcon, 
  ChevronDownIcon,
  CheckIcon,
  CloseIcon
} from "@chakra-ui/icons";
import api from "../../config/axios";

const AdminCategories = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    isActive: "",
    sortBy: "sortOrder",
    sortOrder: "asc"
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 1
  });
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    nepaliName: "",
    description: "",
    sortOrder: 0,
    isActive: true,
    metaTitle: "",
    metaDescription: "",
    removeImage: false
  });

  const loadCategories = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page
      });
      
      const res = await api.get(`/admin/categories?${params}`);
      setCategories(res.data.categories);
      setPagination({
        ...pagination,
        total: res.data.pagination.total,
        pages: res.data.pagination.pages
      });
    } catch (err) {
      console.error("Failed to load categories", err);
      toast({ title: "Failed to load categories", status: "error" });
    }
  };

  useEffect(() => {
    loadCategories();
  }, [filters, pagination.page]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc"
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSelectAll = (e) => {
    setSelectedCategories(
      e.target.checked ? categories.map(cat => cat._id) : []
    );
  };

  const handleSelect = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleBulkAction = async (action) => {
    if (!selectedCategories.length) {
      toast({
        title: "No categories selected",
        status: "warning"
      });
      return;
    }

    try {
      await api.post("/admin/categories/bulk", {
        action,
        categoryIds: selectedCategories
      });

      toast({
        title: `Successfully ${action}d ${selectedCategories.length} categories`,
        status: "success"
      });

      setSelectedCategories([]);
      loadCategories();
    } catch (err) {
      toast({
        title: "Bulk action failed",
        description: err.response?.data?.message || "Please try again",
        status: "error"
      });
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key !== 'removeImage') {
          formData.append(key, form[key]);
        }
      });
      
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (form.removeImage) {
        formData.append("removeImage", true);
      }

      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast({ title: "Category updated", status: "success" });
      } else {
        await api.post("/admin/categories", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast({ title: "Category created", status: "success" });
      }
      
      onClose();
      setForm({
        name: "",
        nepaliName: "",
        description: "",
        sortOrder: 0,
        isActive: true,
        metaTitle: "",
        metaDescription: "",
        removeImage: false
      });
      setImageFile(null);
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      console.error(err);
      toast({ 
        title: editingCategory ? "Failed to update category" : "Failed to create category",
        description: err.response?.data?.message || "Please try again", 
        status: "error" 
      });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      nepaliName: category.nepaliName || "",
      description: category.description || "",
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive
    });
    onOpen();
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    
    try {
      await api.delete(`/admin/categories/${categoryId}`);
      toast({ title: "Category deleted", status: "success" });
      loadCategories();
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Failed to delete category", 
        description: err.response?.data?.message || "Please try again",
        status: "error" 
      });
    }
  };

  return (
    <Box p={8}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            Categories
          </Text>
          <Button leftIcon={<AddIcon />} colorScheme="brand" onClick={() => {
            setEditingCategory(null);
            setForm({
              name: "",
              nepaliName: "",
              description: "",
              sortOrder: 0,
              isActive: true,
              metaTitle: "",
              metaDescription: "",
              removeImage: false
            });
            setImageFile(null);
            onOpen();
          }}>
            Add Category
          </Button>
        </HStack>

        {/* Filters */}
        <Box bg="white" p={4} rounded="md" shadow="sm">
          <HStack spacing={4} wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search categories..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </InputGroup>

            <Select
              maxW="200px"
              name="isActive"
              value={filters.isActive}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>

            <Select
              maxW="200px"
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
            >
              <option value="sortOrder">Sort Order</option>
              <option value="name">Name</option>
              <option value="createdAt">Created Date</option>
            </Select>

            <Select
              maxW="150px"
              name="sortOrder"
              value={filters.sortOrder}
              onChange={handleFilterChange}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </Select>
          </HStack>
        </Box>

        {/* Bulk Actions */}
        {selectedCategories.length > 0 && (
          <HStack bg="white" p={4} rounded="md" shadow="sm">
            <Text>
              {selectedCategories.length} categories selected
            </Text>
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                Bulk Actions
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => handleBulkAction("activate")}>
                  Activate
                </MenuItem>
                <MenuItem onClick={() => handleBulkAction("deactivate")}>
                  Deactivate
                </MenuItem>
                <MenuItem onClick={() => handleBulkAction("delete")} color="red.500">
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        )}

        {/* Categories Table */}
        <Table variant="simple" bg="white" rounded="md" shadow="sm">
          <Thead>
            <Tr>
              <Th width="40px">
                <Checkbox
                  isChecked={selectedCategories.length === categories.length}
                  isIndeterminate={selectedCategories.length > 0 && selectedCategories.length < categories.length}
                  onChange={handleSelectAll}
                />
              </Th>
              <Th>Image</Th>
              <Th>Name</Th>
              <Th>Nepali Name</Th>
              <Th>Description</Th>
              <Th>Products</Th>
              <Th>Sort Order</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {categories.map((category) => (
              <Tr key={category._id}>
                <Td>
                  <Checkbox
                    isChecked={selectedCategories.includes(category._id)}
                    onChange={() => handleSelect(category._id)}
                  />
                </Td>
                <Td>
                  {category.image && (
                    <Image
                      src={category.image}
                      alt={category.name}
                      boxSize="40px"
                      objectFit="cover"
                      rounded="md"
                    />
                  )}
                </Td>
                <Td>{category.name}</Td>
                <Td>{category.nepaliName}</Td>
                <Td noOfLines={2}>{category.description}</Td>
                <Td>
                  <Tag colorScheme={category.productCount > 0 ? "green" : "gray"}>
                    {category.productCount} products
                  </Tag>
                </Td>
                <Td>{category.sortOrder}</Td>
                <Td>
                  <Tag colorScheme={category.isActive ? "green" : "red"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Tag>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleEdit(category)}
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDelete(category._id)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <HStack justify="center" spacing={2} mt={4}>
            <Button
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                size="sm"
                colorScheme={pagination.page === page ? "brand" : "gray"}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </HStack>
        )}

        </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>
              {editingCategory ? "Edit Category" : "Add Category"}
            </ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                {/* Basic Information */}
                <Box bg="gray.50" p={4} rounded="md">
                  <Text fontWeight="bold" mb={4}>Basic Information</Text>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Name</FormLabel>
                      <Input 
                        name="name" 
                        value={form.name} 
                        onChange={handleChange}
                        bg="white" 
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Nepali Name</FormLabel>
                      <Input 
                        name="nepaliName" 
                        value={form.nepaliName} 
                        onChange={handleChange}
                        bg="white"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        bg="white"
                        rows={3}
                      />
                    </FormControl>
                  </VStack>
                </Box>

                {/* Image */}
                <Box bg="gray.50" p={4} rounded="md">
                  <Text fontWeight="bold" mb={4}>Category Image</Text>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>Image</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0])}
                        bg="white"
                      />
                    </FormControl>

                    {editingCategory?.image && !imageFile && (
                      <Box position="relative">
                        <Image
                          src={editingCategory.image}
                          alt={editingCategory.name}
                          maxH="200px"
                          rounded="md"
                        />
                        <IconButton
                          icon={<CloseIcon />}
                          size="sm"
                          position="absolute"
                          top={2}
                          right={2}
                          colorScheme="red"
                          onClick={() => setForm(prev => ({ ...prev, removeImage: true }))}
                          isDisabled={form.removeImage}
                        />
                      </Box>
                    )}
                  </VStack>
                </Box>

                {/* SEO Information */}
                <Box bg="gray.50" p={4} rounded="md">
                  <Text fontWeight="bold" mb={4}>SEO Information</Text>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>Meta Title</FormLabel>
                      <Input
                        name="metaTitle"
                        value={form.metaTitle}
                        onChange={handleChange}
                        bg="white"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Meta Description</FormLabel>
                      <Textarea
                        name="metaDescription"
                        value={form.metaDescription}
                        onChange={handleChange}
                        bg="white"
                        rows={3}
                      />
                    </FormControl>
                  </VStack>
                </Box>

                {/* Settings */}
                <Box bg="gray.50" p={4} rounded="md">
                  <Text fontWeight="bold" mb={4}>Settings</Text>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>Sort Order</FormLabel>
                      <NumberInput min={0} bg="white">
                        <NumberInputField
                          name="sortOrder"
                          value={form.sortOrder}
                          onChange={handleChange}
                        />
                      </NumberInput>
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Active</FormLabel>
                      <Switch
                        name="isActive"
                        isChecked={form.isActive}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </VStack>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" colorScheme="brand">
                {editingCategory ? "Update" : "Create"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminCategories;
