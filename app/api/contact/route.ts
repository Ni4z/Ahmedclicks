import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Here you would typically send an email using a service like Nodemailer, SendGrid, etc.
    // For now, we'll just log it and return success
    console.log('Contact form submission:', { name, email, subject, message });

    // Replace with your actual email sending logic
    // await sendEmail({ to: 'hello@ahmedphotography.com', name, email, subject, message });

    return NextResponse.json(
      { success: true, message: 'Email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
