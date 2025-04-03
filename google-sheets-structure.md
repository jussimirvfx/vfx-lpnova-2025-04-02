# Google Sheets Structure for VFX Leads

Create a sheet with the following columns:

A. Timestamp (=NOW())
B. Name
C. Email
D. Phone
E. Company
F. Sales Team Size
G. Monthly Revenue
H. Segment
I. Message
J. Source
K. Country Code
L. Page URL
M. Form Type
N. Facebook Pixel ID

Notes:
- Set column A to automatically insert timestamp using =NOW()
- Use Data Validation for columns F, G, and H to create dropdowns matching your form options
- Create filters to easily sort and analyze data
- Consider using conditional formatting to highlight:
  * Missing information (red background)
  * New leads (green background for leads in last 24h)
  * High-value leads (bold text for certain monthly revenue ranges)

