import { getContentPosts, getProjects } from "@/lib/supabase/queries";
import { ContentView } from "./content-view";

export default async function ContentPage() {
  const [posts, projects] = await Promise.all([
    getContentPosts(),
    getProjects(),
  ]);

  return <ContentView posts={posts} projects={projects} />;
}
