import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="h-full bg-surface text-on-surface antialiased flex flex-col justify-center items-center p-md min-h-screen">
      <Outlet />
    </div>
  );
}
