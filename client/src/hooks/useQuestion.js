import { useState } from "react";
import { apiClient } from "../services/api.js";

const useQuestion = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addQuestion = async (examId, questionData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(`/api/v1/question/${examId}/questions`, questionData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add question");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addQuestion, loading, error };
};

export default useQuestion;