/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        kanit:  ['Kanit', 'sans-serif'],
        sarabun:['Sarabun', 'sans-serif'],
      },
      colors: {
        mon:  { c:'#B8660E', bg:'#FDF3E3', mid:'#F5C97A', hdr:'#6B3A04' },
        tue:  { c:'#C0365A', bg:'#FDE8EF', mid:'#F5A0B8', hdr:'#7A1436' },
        wed:  { c:'#3A7D0A', bg:'#E8F5DC', mid:'#9FD16A', hdr:'#1D4A02' },
        thu:  { c:'#C07208', bg:'#FEF4E2', mid:'#F5C06A', hdr:'#7A4202' },
        fri:  { c:'#1A5FA8', bg:'#E3EFF9', mid:'#7DB8F0', hdr:'#0C3A6E' },
        sat:  { c:'#5B4EC8', bg:'#EDEAFC', mid:'#A89AEE', hdr:'#342D85' },
        green:{ DEFAULT:'#1D9E75', bg:'#E1F5EE' },
        red:  '#E24B4A',
        ink:  { DEFAULT:'#111111', 2:'#444444', 3:'#888888' },
        paper:'#F7F6F2',
        border:'#E2E0D8',
      },
    },
  },
  plugins: [],
}
