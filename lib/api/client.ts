/**
 * Client-side API wrapper functions
 * Functions for making API calls from React components
 */

/**
 * Update session progress
 */
export async function updateProgress(
  sessionId: string,
  currentQuestionIndex: number,
  status?: "pending" | "in_progress" | "completed" | "expired"
): Promise<boolean> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/progress`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentQuestionIndex, status }),
    });

    if (!response.ok) {
      console.error("Failed to update progress:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating progress:", error);
    return false;
  }
}

/**
 * Create a new recording entry
 */
export async function createRecordingEntry(
  sessionId: string,
  questionId: string,
  questionIndex: number,
  muxAssetId?: string
): Promise<string | null> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/recordings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questionId, questionIndex, muxAssetId }),
    });

    if (!response.ok) {
      console.error("Failed to create recording:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.recordingId;
  } catch (error) {
    console.error("Error creating recording:", error);
    return null;
  }
}

/**
 * Get all recordings for a session
 */
export async function fetchRecordings(sessionId: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/recordings`);

    if (!response.ok) {
      console.error("Failed to fetch recordings:", await response.text());
      return [];
    }

    const data = await response.json();
    return data.recordings || [];
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return [];
  }
}
