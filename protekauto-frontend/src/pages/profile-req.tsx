import { GetServerSideProps } from 'next';

// Страница больше не используется — перенаправляем в настройки аккаунта
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/profile-set',
      permanent: false,
    },
  };
};

export default function ProfileReqRedirect() {
  return null;
}
