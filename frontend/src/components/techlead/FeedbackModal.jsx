import React, { useState } from "react";

import {
  addFeedback,
} from "../../services/techLeadService";

export default function FeedbackModal({
  employeeId,
  updateIndex,
}) {
  const [comment, setComment] =
    useState("");

  const submitFeedback = async () => {
    try {
      await addFeedback(
        employeeId,
        updateIndex,
        comment
      );

      alert("Feedback submitted");

      setComment("");

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="mt-3">

      <textarea
        placeholder="Add feedback..."
        value={comment}
        onChange={(e) =>
          setComment(e.target.value)
        }
        className="w-full border rounded-lg p-2"
      />

      <button
        onClick={submitFeedback}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
      >
        Submit
      </button>

    </div>
  );
}