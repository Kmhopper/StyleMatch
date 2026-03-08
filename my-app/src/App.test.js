import { render, screen } from '@testing-library/react';
import App from './App';

test('renders topbar brand text', () => {
  render(<App />);
  const brandElement = screen.getByText(/Nordic Thread/i);
  expect(brandElement).toBeInTheDocument();
});
