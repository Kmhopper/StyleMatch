import { categoryNames } from "@/lib/categories";
import { CategoryExperience } from "@/components/category/category-experience";

export default function CategoryPage({ params }) {
  let categoryName = params.categoryName;
  try {
    categoryName = decodeURIComponent(params.categoryName);
  } catch {
    categoryName = params.categoryName;
  }

  return <CategoryExperience categoryName={categoryName} categories={categoryNames} />;
}
