import { ProtectedFeaturePage } from "@/components/protected/ProtectedFeaturePage";
import { requireAuthenticatedUser } from "@/lib/serverAuth";

export default async function ProjectPage() {
  await requireAuthenticatedUser();
  return <ProtectedFeaturePage featureKey="project" />;
}
