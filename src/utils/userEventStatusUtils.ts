import { Event } from "../types/event";

/**
 * Checks if a user is a mentor in an event and their involvement type.
 * @param event The event to check
 * @param userId The user's ID to check against
 * @returns An object with mentor involvement flags
 */
export function getMentorInvolvement(event: Event | null | undefined, userId?: string | null) {
  if (!event || !userId) {
    return {
      isRequesting: false,
      isAccepted: false,
      isDeclined: false,
    };
  }

  return {
    isRequesting: event.requestingMentors?.includes(userId) || false,
    isAccepted: event.acceptedMentors?.includes(userId) || false,
    isDeclined: event.declinedMentors?.includes(userId) || false,
  };
}