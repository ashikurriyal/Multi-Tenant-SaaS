"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { bootstrapSession } from "@/redux/session";

// Mounted once in the root layout; renders nothing
export default function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void bootstrapSession(dispatch);
  }, [dispatch]);

  return null;
}
