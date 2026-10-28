const { createNotification } = require("../services/notificationService");

const notifyUser = async ({
  recipient,
  sender = null,
  type,
  title,
  message,
  interviewId,
}) => {
  if (!recipient) {
    return null;
  }

  return createNotification({
    recipient,
    sender,
    type,
    title,
    message,
    relatedInterview: interviewId,
  });
};

const notifyInterviewParticipants = async ({
  interview,
  sender = null,
  type,
  title,
  message,
  includeInterviewer = true,
  includeCandidate = true,
}) => {
  const recipients = new Set();

  if (includeInterviewer && interview.interviewer) {
    recipients.add(interview.interviewer.toString());
  }

  if (includeCandidate && interview.candidate) {
    recipients.add(interview.candidate.toString());
  }

  if (sender) {
    recipients.delete(sender.toString());
  }

  const notifications = await Promise.allSettled(
    [...recipients].map((recipient) =>
      notifyUser({
        recipient,
        sender,
        type,
        title,
        message,
        interviewId: interview._id,
      }),
    ),
  );

  // Notification failure must not break the interview operation.
  notifications.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "Failed to create interview notification:",
        result.reason?.message || result.reason,
      );
    }
  });

  return notifications;
};

module.exports = {
  notifyUser,
  notifyInterviewParticipants,
};
