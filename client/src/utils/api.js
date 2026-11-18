import axios from "axios";
import { API_BASE_URL } from "../config";

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Wraps an axios error, keeping the server's message and the HTTP status.
function toApiError(fallback, error) {
    const data = error.response?.data;
    const serverMessage =
        data?.error || data?.message || (typeof data === "string" ? data : null);
    const apiError = new Error(serverMessage || `${fallback}: ${error.message}`);
    apiError.status = error.response?.status;
    apiError.data = data;
    apiError.cause = error;
    return apiError;
}

export async function getBooks(offset, limit, categories, searchTerm) {
    try {
        const requestData = {
            offset: offset,
            limit: limit,
            categories: categories,
            searchTerm: searchTerm,
        };
        const response = await api.post("/get/books", requestData);
        return response.data;
    } catch (error) {
        throw toApiError("Failed to fetch books", error);
    }
}

export async function getTopPicks() {
    try {
        const response = await api.get("/get/toppicks");
        return response.data;
    } catch (error) {
        throw toApiError("Failed to fetch top picks", error);
    }
}

export async function getCategories() {
    try {
        const response = await api.get("/get/categories");
        return response.data;
    } catch (error) {
        throw toApiError("Failed to fetch categories", error);
    }
}

export async function getRandomBooks(categories, goal, books) {
    try {
        const response = await api.post("/get/getRandomBooks", {
            categories: categories,
            goal: goal,
            books: books,
        });
        return response.data;
    } catch (error) {
        throw toApiError("Failed to fetch random books", error);
    }
}

export async function purchaseBooksAPI(
    previewOptions,
    books,
    selectedButton,
    notesCategories
) {
    try {
        const response = await api.post("/purchase", {
            previewOptions: previewOptions,
            books: books,
            selectedButton: selectedButton,
            notesCategories: notesCategories,
        });
        return response.data;
    } catch (error) {
        throw toApiError("Failed to start checkout", error);
    }
}

export async function getPaymentDetails(sessionId) {
    try {
        const response = await api.post("/get/getPayment", {
            sessionId: sessionId,
        });
        return response.data;
    } catch (error) {
        throw toApiError("Failed to fetch payment details", error);
    }
}

export default api;
