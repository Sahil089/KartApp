"""
WSGI entry point for the Flask application.

This module runs the Flask app by importing it from `app` and 
starting the Flask development server if this file is executed directly.
"""

from app import app

if __name__ == "__main__":
    # Enable debug mode for development (optional)
    app.run(debug=True)
