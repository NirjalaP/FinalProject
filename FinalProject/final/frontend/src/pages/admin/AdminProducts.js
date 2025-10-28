import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  VStack,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Image,
  Badge,
} from "@chakra-ui/react";
import { AddIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";
import api from "../../config/axios";
import { resolveImageUrl } from "../../utils/image";

const AdminProducts = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    price: "",
    categoryId: "",
    status: "active"
  });
  const [imageFile, setImageFile] = useState(null);

  const loadProducts = async () => {
    try {
      const res = await api.get("/admin/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to load products", err);
      toast({ title: "Failed to load products", status: "error" });
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get("/admin/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories", err);
      toast({ title: "Failed to load categories", status: "error" });
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("shortDescription", form.shortDescription);
      payload.append("price", form.price);
      payload.append("categoryId", form.categoryId);
      payload.append("status", form.status);
      if (imageFile) payload.append("image", imageFile);

      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct._id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast({ title: "Product updated", status: "success" });
      } else {
        await api.post("/admin/products", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast({ title: "Product created", status: "success" });
      }

      // Reset form and refresh list
      setForm({ name: "", shortDescription: "", price: "", categoryId: "", status: "active" });
      setImageFile(null);
      setEditingProduct(null);
      onClose();
      loadProducts();
    } catch (err) {
      console.error(err);
      toast({ 
        title: editingProduct ? "Failed to update product" : "Failed to create product", 
        status: "error" 
      });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      shortDescription: product.shortDescription || "",
      price: product.price,
      categoryId: product.category._id,
      status: product.status || "active"
    });
    setImageFile(null);
    onOpen();
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await api.delete(`/admin/products/${productId}`);
      toast({ title: "Product deleted", status: "success" });
      loadProducts();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to delete product", status: "error" });
    }
  };

  return (
    <Box p={8}>
      <HStack justify="space-between" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Products
        </Text>
        <Button leftIcon={<AddIcon />} colorScheme="brand" onClick={() => {
          setEditingProduct(null);
          setForm({ name: "", shortDescription: "", price: "", categoryId: "", status: "active" });
          setImageFile(null);
          onOpen();
        }}>
          Add Product
        </Button>
      </HStack>

      <Table variant="simple" bg="white" rounded="md" shadow="sm">
        <Thead>
          <Tr>
            <Th>Image</Th>
            <Th>Name</Th>
            <Th>Description</Th>
            <Th>Price</Th>
            <Th>Category</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {products.map((product) => (
            <Tr key={product._id}>
              <Td>
                <Image
                  src={resolveImageUrl(
                    product.images?.[0]?.urlThumb ||
                      product.images?.[0]?.url ||
                      `/assets/products/thumb/${product.slug}.jpg` ||
                      `/assets/products/${product.slug}.jpg`
                  )}
                  alt={product.name}
                  boxSize="50px"
                  objectFit="cover"
                  rounded="md"
                  fallbackSrc="/assets/products/default-product.jpg"
                />
              </Td>
              <Td>{product.name}</Td>
              <Td>{product.shortDescription}</Td>
              <Td>₹{product.price}</Td>
              <Td>{product.category?.name}</Td>
              <Td>
                <Badge
                  colorScheme={product.status === "active" ? "green" : "red"}
                >
                  {product.status}
                </Badge>
              </Td>
              <Td>
                <HStack spacing={2}>
                  <IconButton
                    icon={<EditIcon />}
                    size="sm"
                    colorScheme="blue"
                    onClick={() => handleEdit(product)}
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDelete(product._id)}
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>
              {editingProduct ? "Edit Product" : "Add Product"}
            </ModalHeader>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Product Name</FormLabel>
                  <Input name="name" value={form.name} onChange={handleChange} />
                </FormControl>

                <FormControl>
                  <FormLabel>Short Description</FormLabel>
                  <Input
                    name="shortDescription"
                    value={form.shortDescription}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Price</FormLabel>
                  <Input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    type="number"
                    step="0.01"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Image</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                  />
                  {(!imageFile) && (
                    <Image
                      src={resolveImageUrl(
                        editingProduct?.images?.[0]?.urlMedium ||
                          editingProduct?.images?.[0]?.url ||
                          `/assets/products/medium/${editingProduct?.slug}.jpg` ||
                          `/assets/products/${editingProduct?.slug}.jpg`
                      )}
                      alt="Current product image"
                      mt={2}
                      maxH="100px"
                      fallbackSrc="/assets/products/default-product.jpg"
                    />
                  )}
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" colorScheme="brand">
                {editingProduct ? "Update" : "Create"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminProducts;
