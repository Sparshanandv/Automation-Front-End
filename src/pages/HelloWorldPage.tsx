import MessageDisplay from '../components/Message/MessageDisplay'

export default function HelloWorldPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <noscript>
        <p>Hello world</p>
      </noscript>
      <MessageDisplay
        messageKey="hello_world"
        fallbackText="Hello world"
        className="text-center"
      />
    </div>
  )
}
