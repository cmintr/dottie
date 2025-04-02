import { useState } from 'react';

interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

interface FunctionCallDisplayProps {
  functionCall: FunctionCall;
}

/**
 * Component for displaying function call results
 */
const FunctionCallDisplay = ({ functionCall }: FunctionCallDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine which component to render based on function name
  const renderFunctionResult = () => {
    switch (functionCall.name) {
      case 'getGmailMessages':
        return <GmailMessagesDisplay data={functionCall.result} />;
      case 'getCalendarEvents':
        return <CalendarEventsDisplay data={functionCall.result} />;
      case 'getSpreadsheetData':
        return <SpreadsheetDataDisplay data={functionCall.result} />;
      default:
        return <GenericFunctionDisplay data={functionCall.result} />;
    }
  };

  return (
    <div className="mt-4 border rounded-lg overflow-hidden bg-white shadow-sm">
      <div 
        className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="font-medium text-gray-700">
          {formatFunctionName(functionCall.name)}
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          {functionCall.result ? (
            renderFunctionResult()
          ) : (
            <div className="text-gray-500 italic">No result available</div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Format function name for display (camelCase to Title Case)
 */
const formatFunctionName = (name: string): string => {
  // Convert camelCase to space-separated words
  const words = name.replace(/([A-Z])/g, ' $1').trim();
  // Capitalize first letter of each word
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * Generic component for displaying any function result
 */
const GenericFunctionDisplay = ({ data }: { data: any }) => {
  if (!data) return <div className="text-gray-500 italic">No data available</div>;
  
  return (
    <div className="overflow-auto max-h-96">
      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

/**
 * Component for displaying Gmail messages
 */
const GmailMessagesDisplay = ({ data }: { data: any }) => {
  if (!data || !data.messages || !Array.isArray(data.messages)) {
    return <div className="text-gray-500 italic">No messages available</div>;
  }
  
  return (
    <div className="overflow-auto max-h-96">
      <h3 className="text-lg font-medium mb-3">Gmail Messages</h3>
      <div className="space-y-3">
        {data.messages.map((message: any) => (
          <div key={message.id} className="border rounded p-3">
            <div className="font-medium">{message.subject || '(No subject)'}</div>
            <div className="text-sm text-gray-600">
              From: {message.from?.name || message.from?.email || 'Unknown'}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(message.date).toLocaleString()}
            </div>
            <div className="mt-2 text-sm">{message.snippet}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Component for displaying Calendar events
 */
const CalendarEventsDisplay = ({ data }: { data: any }) => {
  if (!data || !data.events || !Array.isArray(data.events)) {
    return <div className="text-gray-500 italic">No events available</div>;
  }
  
  return (
    <div className="overflow-auto max-h-96">
      <h3 className="text-lg font-medium mb-3">Calendar Events</h3>
      <div className="space-y-3">
        {data.events.map((event: any) => (
          <div key={event.id} className="border rounded p-3">
            <div className="font-medium">{event.summary}</div>
            {event.location && (
              <div className="text-sm text-gray-600">
                Location: {event.location}
              </div>
            )}
            <div className="text-sm text-gray-500">
              {formatEventTime(event.start?.dateTime, event.end?.dateTime)}
            </div>
            {event.description && (
              <div className="mt-2 text-sm">{event.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Format event time for display
 */
const formatEventTime = (start?: string, end?: string): string => {
  if (!start || !end) return 'Time not specified';
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const isSameDay = startDate.toDateString() === endDate.toDateString();
  
  if (isSameDay) {
    return `${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}`;
  } else {
    return `${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()} - ${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString()}`;
  }
};

/**
 * Component for displaying Spreadsheet data
 */
const SpreadsheetDataDisplay = ({ data }: { data: any }) => {
  if (!data || !data.sheets || !Array.isArray(data.sheets)) {
    return <div className="text-gray-500 italic">No spreadsheet data available</div>;
  }
  
  return (
    <div className="overflow-auto max-h-96">
      <h3 className="text-lg font-medium mb-3">{data.spreadsheetTitle || 'Spreadsheet'}</h3>
      
      {data.sheets.map((sheet: any) => (
        <div key={sheet.sheetId} className="mb-4">
          <h4 className="font-medium mb-2">{sheet.title}</h4>
          
          {sheet.data && Array.isArray(sheet.data) && sheet.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <tbody>
                  {sheet.data.map((row: any[], rowIndex: number) => (
                    <tr key={rowIndex}>
                      {row.map((cell: any, cellIndex: number) => (
                        <td 
                          key={cellIndex}
                          className={`border border-gray-300 p-2 text-sm ${
                            rowIndex === 0 ? 'font-medium bg-gray-50' : ''
                          }`}
                        >
                          {cell !== null && cell !== undefined ? String(cell) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 italic">No data in this sheet</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FunctionCallDisplay;
