import { google, calendar_v3 } from 'googleapis';
import { authService, GoogleTokens, TokenUpdateCallback } from './authService';

/**
 * Interface for calendar event parameters
 */
interface CalendarEventParams {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  calendarId?: string;
  timeZone?: string;
}

/**
 * Interface for a simplified calendar event
 */
interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: string;
  }[];
  organizer?: {
    email: string;
    displayName?: string;
  };
  htmlLink?: string;
  status?: string;
  created?: string;
  updated?: string;
}

/**
 * Service for interacting with Google Calendar API
 */
export class CalendarService {
  /**
   * Get an authenticated Google Calendar API client
   * @param tokens OAuth tokens from the user's session
   * @param onTokensRefreshed Optional callback function to update tokens when refreshed
   * @returns Authenticated Calendar API client
   */
  private getAuthenticatedCalendarClient(
    tokens: GoogleTokens, 
    onTokensRefreshed?: TokenUpdateCallback
  ): calendar_v3.Calendar {
    if (!tokens || !tokens.access_token) {
      throw new Error('Authentication required for calendar access');
    }

    try {
      // Get an authenticated OAuth2 client with token refresh callback
      const authClient = authService.createAuthenticatedClient(tokens, undefined, onTokensRefreshed as TokenUpdateCallback);
      
      // Create a Calendar API client with the authenticated OAuth2 client
      return google.calendar({ 
        version: 'v3', 
        auth: authClient 
      });
    } catch (error) {
      console.error('Error creating authenticated calendar client:', error);
      throw new Error('Failed to create authenticated calendar client');
    }
  }

  /**
   * Get calendar events based on provided parameters
   * @param tokens OAuth tokens from the user's session
   * @param params Parameters for fetching calendar events
   * @param onTokensRefreshed Optional callback function to update tokens when refreshed
   * @returns Array of calendar events
   */
  async getCalendarEvents(
    tokens: GoogleTokens, 
    params: CalendarEventParams,
    onTokensRefreshed?: TokenUpdateCallback
  ): Promise<CalendarEvent[]> {
    try {
      // Get an authenticated Calendar API client with token refresh callback
      const calendar = this.getAuthenticatedCalendarClient(tokens, onTokensRefreshed);
      
      console.log('Fetching calendar events with params:', params);
      
      // Set default values for parameters
      const timeMin = params.timeMin || new Date().toISOString();
      const maxResults = params.maxResults || 10;
      const calendarId = params.calendarId || 'primary';
      
      // Make the API call to fetch events
      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin,
        timeMax: params.timeMax,
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: params.timeZone
      });
      
      const events = response.data.items || [];
      console.log(`Fetched ${events.length} calendar events`);
      
      // Format the events to a simplified structure
      return events.map(event => {
        // Handle null values by converting them to undefined
        const description = event.description === null ? undefined : event.description;
        const location = event.location === null ? undefined : event.location;
        
        // Handle start and end date/time
        const start = {
          dateTime: event.start?.dateTime === null ? undefined : event.start?.dateTime,
          date: event.start?.date === null ? undefined : event.start?.date,
          timeZone: event.start?.timeZone === null ? undefined : event.start?.timeZone
        };
        
        const end = {
          dateTime: event.end?.dateTime === null ? undefined : event.end?.dateTime,
          date: event.end?.date === null ? undefined : event.end?.date,
          timeZone: event.end?.timeZone === null ? undefined : event.end?.timeZone
        };
        
        // Handle attendees
        const attendees = event.attendees?.map(attendee => ({
          email: attendee.email || '',
          displayName: attendee.displayName === null ? undefined : attendee.displayName,
          responseStatus: attendee.responseStatus === null ? undefined : attendee.responseStatus
        }));
        
        // Handle organizer
        const organizer = event.organizer ? {
          email: event.organizer.email || '',
          displayName: event.organizer.displayName === null ? undefined : event.organizer.displayName
        } : undefined;
        
        // Handle other fields
        const htmlLink = event.htmlLink === null ? undefined : event.htmlLink;
        const status = event.status === null ? undefined : event.status;
        const created = event.created === null ? undefined : event.created;
        const updated = event.updated === null ? undefined : event.updated;
        
        return {
          id: event.id || '',
          summary: event.summary || 'Untitled Event',
          description,
          location,
          start,
          end,
          attendees,
          organizer,
          htmlLink,
          status,
          created,
          updated
        };
      });
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      
      // Handle specific API errors
      if (error.code === 401 || error.code === 403) {
        throw new Error('Authentication error: ' + (error.message || 'Access denied'));
      }
      
      throw new Error('Failed to fetch calendar events: ' + (error.message || 'Unknown error'));
    }
  }

  /**
   * Create a new calendar event
   * @param tokens OAuth tokens from the user's session
   * @param eventDetails Details of the event to create
   * @param onTokensRefreshed Optional callback function to update tokens when refreshed
   * @returns Created event
   */
  async createCalendarEvent(
    tokens: GoogleTokens,
    eventDetails: {
      summary: string;
      description?: string;
      location?: string;
      start: { dateTime: string; timeZone?: string } | { date: string };
      end: { dateTime: string; timeZone?: string } | { date: string };
      attendees?: { email: string }[];
      calendarId?: string;
    },
    onTokensRefreshed?: TokenUpdateCallback
  ): Promise<CalendarEvent> {
    try {
      // Get an authenticated Calendar API client with token refresh callback
      const calendar = this.getAuthenticatedCalendarClient(tokens, onTokensRefreshed);
      
      console.log('Creating calendar event:', eventDetails.summary);
      
      // Make the API call to create the event
      const response = await calendar.events.insert({
        calendarId: eventDetails.calendarId || 'primary',
        requestBody: {
          summary: eventDetails.summary,
          description: eventDetails.description,
          location: eventDetails.location,
          start: eventDetails.start,
          end: eventDetails.end,
          attendees: eventDetails.attendees,
        },
      });
      
      console.log('Event created:', response.data.id);
      
      // Return the created event in our simplified format
      const event = response.data;
      return {
        id: event.id || '',
        summary: event.summary || '',
        description: event.description || undefined,
        location: event.location || undefined,
        start: {
          dateTime: event.start?.dateTime || undefined,
          date: event.start?.date || undefined,
          timeZone: event.start?.timeZone || undefined,
        },
        end: {
          dateTime: event.end?.dateTime || undefined,
          date: event.end?.date || undefined,
          timeZone: event.end?.timeZone || undefined,
        },
        htmlLink: event.htmlLink || undefined,
      };
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
      
      // Handle specific API errors
      if (error.code === 401 || error.code === 403) {
        throw new Error('Authentication error: ' + (error.message || 'Access denied'));
      }
      
      throw new Error('Failed to create calendar event: ' + (error.message || 'Unknown error'));
    }
  }
}

// Export a singleton instance
export const calendarService = new CalendarService();
