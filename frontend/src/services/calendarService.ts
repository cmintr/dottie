import { ApiService } from './api';

/**
 * Interface for calendar event
 */
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    name?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  hangoutLink?: string;
  conferenceData?: any;
  recurrence?: string[];
  recurringEventId?: string;
}

/**
 * Interface for calendar events list response
 */
interface CalendarEventsResponse {
  events: CalendarEvent[];
  nextPageToken?: string;
}

/**
 * Interface for creating/updating calendar event request
 */
interface CalendarEventRequest {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    name?: string;
  }>;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey?: {
        type: string;
      };
    };
  };
  recurrence?: string[];
}

/**
 * Service for Google Calendar-related API calls
 */
export class CalendarService {
  /**
   * Get upcoming calendar events
   * @param timeMin Optional minimum time for events (ISO string)
   * @param timeMax Optional maximum time for events (ISO string)
   * @param maxResults Maximum number of events to retrieve
   * @param pageToken Optional token for pagination
   * @returns Promise with list of calendar events
   */
  static async getEvents(
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 10,
    pageToken?: string
  ): Promise<CalendarEventsResponse> {
    try {
      let endpoint = `/calendar/events?maxResults=${maxResults}`;
      
      if (timeMin) {
        endpoint += `&timeMin=${encodeURIComponent(timeMin)}`;
      }
      
      if (timeMax) {
        endpoint += `&timeMax=${encodeURIComponent(timeMax)}`;
      }
      
      if (pageToken) {
        endpoint += `&pageToken=${pageToken}`;
      }
      
      return await ApiService.get<CalendarEventsResponse>(endpoint);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  /**
   * Get a specific calendar event by ID
   * @param eventId ID of the event to retrieve
   * @returns Promise with the event details
   */
  static async getEvent(eventId: string): Promise<CalendarEvent> {
    try {
      return await ApiService.get<CalendarEvent>(`/calendar/events/${eventId}`);
    } catch (error) {
      console.error(`Error fetching calendar event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new calendar event
   * @param eventData Event data including summary, time, and attendees
   * @returns Promise with the created event
   */
  static async createEvent(eventData: CalendarEventRequest): Promise<CalendarEvent> {
    try {
      return await ApiService.post<CalendarEvent>('/calendar/events', eventData);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   * @param eventId ID of the event to update
   * @param eventData Updated event data
   * @returns Promise with the updated event
   */
  static async updateEvent(
    eventId: string,
    eventData: CalendarEventRequest
  ): Promise<CalendarEvent> {
    try {
      return await ApiService.put<CalendarEvent>(`/calendar/events/${eventId}`, eventData);
    } catch (error) {
      console.error(`Error updating calendar event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   * @param eventId ID of the event to delete
   * @returns Promise with success status
   */
  static async deleteEvent(eventId: string): Promise<{ success: boolean }> {
    try {
      return await ApiService.delete<{ success: boolean }>(`/calendar/events/${eventId}`);
    } catch (error) {
      console.error(`Error deleting calendar event ${eventId}:`, error);
      throw error;
    }
  }
}
