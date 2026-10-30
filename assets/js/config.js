/* =========================================================
   Example — site settings
   ---------------------------------------------------------
   booking.mode:
     'demo'     — bookings are stored only in the visitor's browser (default)
     'endpoint' — bookings are sent as a JSON POST request to booking.endpoint.
                  Example server function: server/booking-worker.js
   ========================================================= */
window.EX_CONFIG = {
  booking: {
    mode: 'demo',
    endpoint: '',
    timeoutMs: 12000
  },
  cafe: {
    name: 'Example',
    address: '7 Example Street, Kyiv',
    phone: '+380 44 000 00 00',
    mapQuery: '50.4655,30.5155'
  }
};
