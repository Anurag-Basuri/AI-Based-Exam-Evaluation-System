import { useState } from "react";
import { apiClient } from "../services/api.js";

const useExam = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createExam = async (examData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/api/v1/exam", examData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create exam");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createExam, loading, error };
};

export default useExam;