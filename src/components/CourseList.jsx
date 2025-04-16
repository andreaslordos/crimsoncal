// CourseList.jsx
import React, { useState, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import CourseListItem from "./CourseListItem";
import { ChevronUp, ChevronDown } from "lucide-react";

const CourseList = () => {
  const { filteredCourses } = useAppContext();
  const [sortField, setSortField] = useState("subject_catalog");
  const [sortDirection, setSortDirection] = useState("asc");
  
  // Handle header click for sorting
  const handleSortClick = (field) => {
      if (sortField === field) {
          // Toggle direction if same field
          setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
          // New field, default to ascending for subject_catalog and course_title
          // but descending (highest first) for rating and hours
          if (field === "rating" || field === "hours") {
              setSortDirection("desc");
          } else {
              setSortDirection("asc");
          }
          setSortField(field);
      }
  };
  
  // Sort courses based on the current sort field and direction
  const sortedCourses = useMemo(() => {
      if (!filteredCourses.length) return [];
      
      return [...filteredCourses].sort((a, b) => {
          let valueA, valueB;
          
          // Extract the values based on sort field
          switch (sortField) {
              case "subject_catalog":
                  valueA = a.subject_catalog || "";
                  valueB = b.subject_catalog || "";
                  break;
              case "rating":
                  valueA = a.rating || "n/a";
                  valueB = b.rating || "n/a";
                  break;
              case "hours":
                  valueA = a.hours || "n/a";
                  valueB = b.hours || "n/a";
                  break;
              case "course_title":
                  valueA = a.course_title || "";
                  valueB = b.course_title || "";
                  break;
              default:
                  return 0;
          }
          
          // Handle N/A values - always put them at the end
          if (valueA === "n/a" && valueB !== "n/a") return 1;
          if (valueA !== "n/a" && valueB === "n/a") return -1;
          if (valueA === "n/a" && valueB === "n/a") return 0;
          
          // Compare based on type
          let result;
          if (typeof valueA === "number" && typeof valueB === "number") {
              result = valueA - valueB;
          } else {
              result = String(valueA).localeCompare(String(valueB));
          }
          
          // Apply sort direction
          return sortDirection === "asc" ? result : -result;
      });
  }, [filteredCourses, sortField, sortDirection]);
  
  // Simple sortable icon component using SVG
  const SortableIcon = () => (
    <span className="ml-1 inline-flex">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9.5L6.5 13L10 9.5" strokeWidth="1.5" stroke="currentColor" fill="none"/>
        <path d="M3 6.5L6.5 3L10 6.5" strokeWidth="1.5" stroke="currentColor" fill="none"/>
      </svg>
    </span>
  );
  
  return (
    <div className="mb-4">
      <div className="grid grid-cols-8 md:grid-cols-16 font-semibold text-sm mb-2 px-2">
        <div className="col-span-1"></div>
        <div 
          className="col-span-3 flex items-center underline hover:text-blue-600 cursor-pointer"
          onClick={() => handleSortClick("subject_catalog")}
        >
          Course
          {sortField === "subject_catalog" ? (
            sortDirection === "asc" ? 
              <ChevronUp size={16} className="ml-1" /> : 
              <ChevronDown size={16} className="ml-1" />
          ) : (
            <SortableIcon />
          )}
        </div>
        <div 
          className="col-span-2 text-center underline flex items-center justify-center hover:text-blue-600 cursor-pointer"
          onClick={() => handleSortClick("rating")}
        >
          Rating
          {sortField === "rating" ? (
            sortDirection === "asc" ? 
              <ChevronUp size={16} className="ml-1" /> : 
              <ChevronDown size={16} className="ml-1" />
          ) : (
            <SortableIcon />
          )}
        </div>
        <div 
          className="col-span-2 text-center underline flex items-center justify-center hover:text-blue-600 cursor-pointer"
          onClick={() => handleSortClick("hours")}
        >
          Hours
          {sortField === "hours" ? (
            sortDirection === "asc" ? 
              <ChevronUp size={16} className="ml-1" /> : 
              <ChevronDown size={16} className="ml-1" />
          ) : (
            <SortableIcon />
          )}
        </div>
        <div 
          className="col-span-0 md:col-span-8 text-right underline hidden md:flex items-center justify-start hover:text-blue-600 cursor-pointer"
          onClick={() => handleSortClick("course_title")}
        >
          Name
          {sortField === "course_title" ? (
            sortDirection === "asc" ? 
              <ChevronUp size={16} className="ml-1" /> : 
              <ChevronDown size={16} className="ml-1" />
          ) : (
            <SortableIcon />
          )}
        </div>
      </div>
      <div className="divide-y max-h-80 overflow-y-auto border rounded bg-white">
        {sortedCourses.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No courses match your filter criteria</div>
        ) : (
          sortedCourses.map((course, index) => (
            <CourseListItem 
              key={`${course.course_id}-${course.subject_catalog}-${index}`} 
              course={course} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CourseList;