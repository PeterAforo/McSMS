import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard, { DataCard, EmptyState, Badge, ProgressBar } from './StatCard';
import { Users, BookOpen } from 'lucide-react';

describe('StatCard', () => {
  it('renders with label and value', () => {
    render(
      <StatCard 
        label="Total Students" 
        value={150} 
        icon={Users}
      />
    );

    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('renders with change indicator', () => {
    render(
      <StatCard 
        label="Revenue" 
        value="$5,000" 
        icon={Users}
        change="+12%"
        changeType="increase"
      />
    );

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('renders with subValue', () => {
    render(
      <StatCard 
        label="Attendance" 
        value="95%" 
        icon={Users}
        subValue="This week"
      />
    );

    expect(screen.getByText('Attendance')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const { container } = render(
      <StatCard 
        label="Test" 
        value={100} 
        icon={Users}
        loading={true}
      />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('applies custom color class', () => {
    const { container } = render(
      <StatCard 
        label="Test" 
        value={100} 
        icon={Users}
        color="green"
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('DataCard', () => {
  it('renders with title and children', () => {
    render(
      <DataCard title="Test Card">
        <p>Card content</p>
      </DataCard>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with subtitle', () => {
    render(
      <DataCard title="Main Title" subtitle="Subtitle text">
        <p>Content</p>
      </DataCard>
    );

    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const { container } = render(
      <DataCard title="Loading Card" loading={true}>
        <p>Content</p>
      </DataCard>
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders with title and description', () => {
    render(
      <EmptyState 
        icon={BookOpen}
        title="No Data" 
        description="There is no data to display"
      />
    );

    expect(screen.getByText('No Data')).toBeInTheDocument();
    expect(screen.getByText('There is no data to display')).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('renders with text', () => {
    render(<Badge color="green">Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with dot', () => {
    const { container } = render(<Badge color="red" dot>Error</Badge>);
    expect(container.querySelector('.rounded-full.bg-red-500')).toBeInTheDocument();
  });
});

describe('ProgressBar', () => {
  it('renders with correct percentage', () => {
    render(<ProgressBar value={75} max={100} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders without label when showLabel is false', () => {
    render(<ProgressBar value={50} max={100} showLabel={false} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });
});
