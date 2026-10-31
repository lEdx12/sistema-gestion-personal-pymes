// Set mínimo de iconos propios (sin agregar una librería externa): SVGs de línea
// simples, 20x20, pensados para el sidebar y las tarjetas del dashboard.

const base = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconHome(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8.5 10 3l7 5.5" />
      <path d="M4.5 7.5V16a1 1 0 0 0 1 1H14.5a1 1 0 0 0 1-1V7.5" />
      <path d="M7.5 17v-4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V17" />
    </svg>
  );
}

export function IconUsers(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="7" cy="7" r="2.6" />
      <path d="M2.2 16c0-2.6 2.1-4.2 4.8-4.2s4.8 1.6 4.8 4.2" />
      <circle cx="14" cy="6.5" r="2" />
      <path d="M13 11.9c2.1.2 3.8 1.6 3.8 4.1" />
    </svg>
  );
}

export function IconFileText(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 2.5h5.5L15 6v10.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" />
      <path d="M11.3 2.5V6H15" />
      <path d="M6.8 10h6M6.8 12.6h6M6.8 15h3.5" />
    </svg>
  );
}

export function IconClock(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6.2V10l2.8 1.8" />
    </svg>
  );
}

export function IconCash(props) {
  return (
    <svg {...base} {...props}>
      <rect x="2.2" y="5.5" width="15.6" height="9.5" rx="1.4" />
      <circle cx="10" cy="10.25" r="2.3" />
      <path d="M4.6 7.5h.01M15.4 13h.01" />
    </svg>
  );
}

export function IconBell(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 8.2a5 5 0 0 1 10 0c0 3 1 4 1.6 4.8H3.4C4 12.2 5 11.2 5 8.2Z" />
      <path d="M8.2 15.5a1.8 1.8 0 0 0 3.6 0" />
    </svg>
  );
}

export function IconUserCog(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="6.5" r="2.8" />
      <path d="M2.8 17c0-3 2.3-5 5.2-5" />
      <circle cx="15" cy="13.5" r="2.2" />
      <path d="M15 10.4v.9M15 15.7v.9M12.6 13.5h.9M16.5 13.5h.9M13.3 11.3l.65.65M16.05 15.05l.65.65M16.7 11.3l-.65.65M13.95 15.05l-.65.65" />
    </svg>
  );
}

export function IconFolder(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 6a1 1 0 0 1 1-1h3.3l1.3 1.6h8.4a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V6Z" />
    </svg>
  );
}

export function IconLogout(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8 17H4.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1H8" />
      <path d="M12.5 13.5 17 10l-4.5-3.5" />
      <path d="M17 10H7.5" />
    </svg>
  );
}

export function IconChevronRight(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  );
}

export function IconAlertTriangle(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10 3.3 17.3 16H2.7Z" />
      <path d="M10 8v3.3M10 14.1h.01" />
    </svg>
  );
}

export function IconEdit(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12.3 3.3a1.5 1.5 0 0 1 2.1 0l2.3 2.3a1.5 1.5 0 0 1 0 2.1L7.2 17.2l-4 .9.9-4Z" />
      <path d="M11 4.6 15.4 9" />
    </svg>
  );
}

export function IconPower(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10 2.8v6.4" />
      <path d="M5.8 5.3a6.3 6.3 0 1 0 8.4 0" />
    </svg>
  );
}

export function IconKey(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="6.3" cy="13.7" r="3.2" />
      <path d="M8.5 11.5 15.5 4.5" />
      <path d="M13 7l2 2M15.7 4.3l2 2" />
    </svg>
  );
}

export function IconEye(props) {
  return (
    <svg {...base} {...props}>
      <path d="M1.8 10S4.8 4.3 10 4.3 18.2 10 18.2 10 15.2 15.7 10 15.7 1.8 10 1.8 10Z" />
      <circle cx="10" cy="10" r="2.3" />
    </svg>
  );
}

export function IconTrash(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 5.5h13" />
      <path d="M7.8 5.5V4a1 1 0 0 1 1-1h2.4a1 1 0 0 1 1 1v1.5" />
      <path d="M5.3 5.5 6 16a1.3 1.3 0 0 0 1.3 1.2h5.4A1.3 1.3 0 0 0 14 16l.7-10.5" />
      <path d="M8.3 8.8v4.6M11.7 8.8v4.6" />
    </svg>
  );
}

export function IconUpload(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10 13V4.5" />
      <path d="M6.8 7.3 10 4l3.2 3.3" />
      <path d="M3.5 13.3V15a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-1.7" />
    </svg>
  );
}

export function IconCheck(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 10.5 7.5 14.5 16.5 5.5" />
    </svg>
  );
}

export function IconPlus(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

export function IconSettings(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.8v1.8M10 15.4v1.8M17.2 10h-1.8M4.6 10H2.8M15.1 4.9l-1.27 1.27M6.17 13.83 4.9 15.1M15.1 15.1l-1.27-1.27M6.17 6.17 4.9 4.9" />
    </svg>
  );
}
