import { createBrowserRouter } from "react-router-dom";
import { Providers } from "./components/Providers";
import { RequireAuth } from "./components/Shell";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import BookEditor from "./pages/BookEditor";
import Categories from "./pages/Categories";
import TopPicks from "./pages/TopPicks";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
    {
        element: <Providers />,
        children: [
            { path: "/login", element: <Login /> },
            { path: "/forgot-password", element: <ForgotPassword /> },
            { path: "/reset-password", element: <ResetPassword /> },
            {
                element: <RequireAuth />,
                children: [
                    { path: "/", element: <Dashboard /> },
                    { path: "/books", element: <Books /> },
                    { path: "/books/new", element: <BookEditor /> },
                    { path: "/books/:id", element: <BookEditor /> },
                    { path: "/categories", element: <Categories /> },
                    { path: "/top-picks", element: <TopPicks /> },
                ],
            },
            { path: "*", element: <NotFound /> },
        ],
    },
]);
