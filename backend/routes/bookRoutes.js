import express from "express";

import {
    createBook,
    getBooks,
    getBookById,
    updateBook,
    deleteBook
} from "../controllers/bookController.js";

import upload from "../middleware/upload.js"

const router = express.Router();

//Create book with image
router.post('/',upload.single("cover"),createBook);

//Get all books
router.get("/",getBooks)

//Get single book
router.get("/:id",getBookById);

//Update book and optionally replace image
router.put("/:id",upload.single("cover"), updateBook);

//Delete Book
router.delete("/:id",deleteBook);

export default router;