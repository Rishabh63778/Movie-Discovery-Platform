const iconProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false"
}

export function ChevronDownIcon({ className = "" }) {
    return (
        <svg {...iconProps} className={className}>
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}

export function UserIcon({ className = "" }) {
    return (
        <svg {...iconProps} className={className}>
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}

export function LogoutIcon({ className = "" }) {
    return (
        <svg {...iconProps} className={className}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
        </svg>
    )
}

export function CameraIcon({ className = "" }) {
    return (
        <svg {...iconProps} className={className}>
            <path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3l-1.5-2Z" />
            <circle cx="12" cy="13" r="3.5" />
        </svg>
    )
}

export function MailIcon({ className = "" }) {
    return (
        <svg {...iconProps} className={className}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
        </svg>
    )
}

export function CalendarIcon({ className = "" }) {
    return (
        <svg {...iconProps} className={className}>
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    )
}

