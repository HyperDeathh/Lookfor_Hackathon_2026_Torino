import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
    try {
        const docsDir = path.join(process.cwd(), 'docs')

        if (!fs.existsSync(docsDir)) {
            return NextResponse.json({ success: true, data: [] })
        }

        const files = fs.readdirSync(docsDir)
            .filter(file => file.endsWith('.md'))
            .map(file => ({
                name: file,
                path: `/docs/${file}`
            }))

        return NextResponse.json({
            success: true,
            data: files
        })
    } catch (error) {
        console.error('Error reading docs directory:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to load documentation' },
            { status: 500 }
        )
    }
}
