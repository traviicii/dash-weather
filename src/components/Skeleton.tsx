import React from "react"

type SkeletonProps = {
  className?: string
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return <div className={`skeleton ${className ?? ""}`.trim()} />
}

export default Skeleton
