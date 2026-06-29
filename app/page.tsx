'use client'
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.push('/login');
  }, [])
  return (
    <div className="bg-gray-100 flex items-center justify-center h-screen text-3xl">
      {/* <h1 className="text-blue-500">Welcome to Photography Studio Management System</h1> */}
      <h1 className="text-blue-500">Loading...</h1>
    </div>
  );
}
