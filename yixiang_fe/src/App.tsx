import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import CreatePage from "@/pages/CreatePage";
import PostDetailPage from "@/pages/PostDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import EditProfilePage from "@/pages/EditProfilePage";
import LearningPage from "@/pages/LearningPage";
import FollowListPage from "@/pages/FollowListPage";
import NotificationPage from "@/pages/NotificationPage";
import CollectionsPage from "@/pages/CollectionsPage";
import CircleSquarePage from "@/pages/CircleSquarePage";
import CircleDetailPage from "@/pages/CircleDetailPage";

export default function App() {
  return (
    <TooltipProvider>
      <Routes>
        {/* Auth pages — no layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Main pages — with layout */}
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="learn" element={<LearningPage />} />
          <Route path="post/:id" element={<PostDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/edit" element={<EditProfilePage />} />
          <Route path="user/:id" element={<ProfilePage />} />
          <Route path="follows" element={<FollowListPage />} />
          <Route path="notifications" element={<NotificationPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="circles" element={<CircleSquarePage />} />
          <Route path="circles/:id" element={<CircleDetailPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </TooltipProvider>
  );
}
