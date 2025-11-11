import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import CourseListItem from "./CourseListItem";
import { ChevronUp, ChevronDown } from "lucide-react";
import { FixedSizeList as List } from 'react-window';

const CourseList = () => {
  const { filteredCourses, fitsScheduleEnabled, setFitsScheduleEnabled, selectedCourse } = useAppContext();
  const [sortField, setSortField] = useState("subject_catalog");
  const [sortDirection, setSortDirection] = useState("asc");
  const listRef = useRef(null);
  const maintainPositionRef = useRef(null);
  
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
    <span className="inline-flex ml-0.5">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9.5L6.5 13L10 9.5" strokeWidth="1.5" stroke="currentColor" fill="none"/>
        <path d="M3 6.5L6.5 3L10 6.5" strokeWidth="1.5" stroke="currentColor" fill="none"/>
      </svg>
    </span>
  );

  // Handler for before adding a course - capture position if fits schedule is enabled
  const handleBeforeAddCourse = useCallback((course) => {
    // Only maintain position if fits schedule is enabled
    if (fitsScheduleEnabled && listRef.current) {
      const courseIndex = sortedCourses.findIndex(c => c.course_id === course.course_id);
      if (courseIndex !== -1) {
        const scrollTop = listRef.current.state?.scrollOffset || 0;
        const itemTop = courseIndex * 56;
        const offsetFromTop = itemTop - scrollTop;

        maintainPositionRef.current = {
          courseId: course.course_id,
          offsetFromTop: offsetFromTop
        };
      }
    }
  }, [fitsScheduleEnabled, sortedCourses]);

  // Handler for before removing a course - capture position if fits schedule is enabled
  const handleBeforeRemoveCourse = useCallback((course) => {
    // Only maintain position if fits schedule is enabled
    if (fitsScheduleEnabled && listRef.current) {
      const courseIndex = sortedCourses.findIndex(c => c.course_id === course.course_id);
      if (courseIndex !== -1) {
        const scrollTop = listRef.current.state?.scrollOffset || 0;
        const itemTop = courseIndex * 56;
        const offsetFromTop = itemTop - scrollTop;

        maintainPositionRef.current = {
          courseId: course.course_id,
          offsetFromTop: offsetFromTop
        };
      }
    }
  }, [fitsScheduleEnabled, sortedCourses]);

  // Row renderer for virtual list
  const Row = useCallback(({ index, style }) => {
    const course = sortedCourses[index];
    return (
      <div style={style} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
        <CourseListItem
          course={course}
          onBeforeAdd={handleBeforeAddCourse}
          onBeforeRemove={handleBeforeRemoveCourse}
        />
      </div>
    );
  }, [sortedCourses, handleBeforeAddCourse, handleBeforeRemoveCourse]);

  // Handler for fits schedule checkbox
  const handleFitsScheduleChange = (e) => {
    const newValue = e.target.checked;

    // Before changing, capture the exact position
    if (selectedCourse && listRef.current) {
      const oldIndex = sortedCourses.findIndex(c => c.course_id === selectedCourse.course_id);
      if (oldIndex !== -1) {
        const scrollTop = listRef.current.state?.scrollOffset || 0;
        const itemTop = oldIndex * 56; // item height
        const offsetFromTop = itemTop - scrollTop;

        maintainPositionRef.current = {
          courseId: selectedCourse.course_id,
          offsetFromTop: offsetFromTop
        };
      }
    }

    setFitsScheduleEnabled(newValue);
  };

  // Restore position after filter change
  useEffect(() => {
    if (!maintainPositionRef.current || !listRef.current) return;

    const { courseId, offsetFromTop } = maintainPositionRef.current;
    const newIndex = sortedCourses.findIndex(c => c.course_id === courseId);

    if (newIndex !== -1) {
      // Calculate new scroll position to maintain the same offset from top
      const newItemTop = newIndex * 56;
      const newScrollTop = newItemTop - offsetFromTop;

      // Use RAF to ensure DOM has updated
      requestAnimationFrame(() => {
        if (listRef.current) {
          const maxScroll = Math.max(0, sortedCourses.length * 56 - 320);
          const clampedScroll = Math.max(0, Math.min(newScrollTop, maxScroll));
          listRef.current.scrollTo(clampedScroll);
        }
        maintainPositionRef.current = null;
      });
    } else {
      maintainPositionRef.current = null;
    }
  }, [sortedCourses]);

  return (
    <div className="mb-4">
      {/* Mobile-only: Checkbox centered above headers */}
      <div className="flex justify-center mb-2 md:hidden">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={fitsScheduleEnabled || false}
            onChange={handleFitsScheduleChange}
            className="mr-1.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            Fits schedule
          </span>
        </label>
      </div>
      <div className="relative mb-2">
        <div className="grid grid-cols-8 md:grid-cols-16 font-semibold text-xs sm:text-sm px-2 text-gray-700">
          <div className="col-span-1"></div>
          <div
            className="col-span-3 text-left flex items-center underline cursor-pointer truncate hover:text-gray-900"
            onClick={() => handleSortClick("subject_catalog")}
          >
            Course
            {sortField === "subject_catalog" ? (
              sortDirection === "asc" ?
                <ChevronUp size={14} className="ml-0.5 flex-shrink-0" /> :
                <ChevronDown size={14} className="ml-0.5 flex-shrink-0" />
            ) : (
              <SortableIcon />
            )}
          </div>
          <div
            className="col-span-2 flex items-center justify-center underline cursor-pointer truncate hover:text-gray-900"
            onClick={() => handleSortClick("rating")}
          >
            Rating
            {sortField === "rating" ? (
              sortDirection === "asc" ?
                <ChevronUp size={14} className="ml-0.5 flex-shrink-0" /> :
                <ChevronDown size={14} className="ml-0.5 flex-shrink-0" />
            ) : (
              <SortableIcon />
            )}
          </div>
          <div
            className="col-span-2 flex items-center justify-center underline cursor-pointer truncate hover:text-gray-900"
            onClick={() => handleSortClick("hours")}
          >
            Hours
            {sortField === "hours" ? (
              sortDirection === "asc" ?
                <ChevronUp size={14} className="ml-0.5 flex-shrink-0" /> :
                <ChevronDown size={14} className="ml-0.5 flex-shrink-0" />
            ) : (
              <SortableIcon />
            )}
          </div>
          <div
            className="col-span-0 md:col-span-8 text-left underline hidden md:flex items-center cursor-pointer hover:text-gray-900"
            onClick={() => handleSortClick("course_title")}
          >
            Name
            {sortField === "course_title" ? (
              sortDirection === "asc" ?
                <ChevronUp size={14} className="ml-0.5 flex-shrink-0" /> :
                <ChevronDown size={14} className="ml-0.5 flex-shrink-0" />
            ) : (
              <SortableIcon />
            )}
          </div>
        </div>
        {/* Desktop-only: Checkbox on the right side */}
        <div className="hidden md:flex absolute top-0 right-2 bottom-0 items-center">
          <label className="flex items-center cursor-pointer h-fit">
            <input
              type="checkbox"
              checked={fitsScheduleEnabled || false}
              onChange={handleFitsScheduleChange}
              className="mr-1.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
              Fits schedule
            </span>
          </label>
        </div>
      </div>
      <div className="border rounded bg-white" style={{
        borderColor: '#e5e5e5'
      }}>
        {sortedCourses.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No courses match your filter criteria</div>
        ) : (
          <List
            ref={listRef}
            height={320}
            itemCount={sortedCourses.length}
            itemSize={56}
            width="100%"
            className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
          >
            {Row}
          </List>
        )}
      </div>
    </div>
  );
};

export default CourseList;