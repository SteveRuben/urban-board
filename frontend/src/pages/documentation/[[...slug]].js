// pages/admin/documentation/[[...slug]].js
import { useRouter } from 'next/router';

import DashboardLayout from '../../../components/layout/DashboardLayout';
import DocumentationLayout from '../../../components/documentation/DocumentationLayout';
import DocumentationContent from '../../../components/documentation/DocumentationContent';

const  DocumentationPage = () => {
  const router = useRouter();
  const { slug } = router.query;

  // Convertir slug en chaîne de caractères appropriée pour l'API
  let docSlug = '';
  if (slug && Array.isArray(slug)) {
    docSlug = slug.join('/');
  } else if (slug) {
    docSlug = slug;
  }

  return (
    <>
      <DocumentationLayout>
        <DocumentationContent slug={docSlug} />
      </DocumentationLayout>
    </>
  );
}

DocumentationPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default DocumentationPage;