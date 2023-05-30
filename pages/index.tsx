import clsx from "clsx";
import { motion } from "framer-motion";
import localFont from "next/font/local";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "usehooks-ts";

const formatter = new Intl.NumberFormat("en-US");

const sentient = localFont({ src: "Sentient-Variable.ttf" });

const endDate = new Date("2023-06-02T12:30:00-07:00");
const excludedDates = [
  new Date("2023-05-15T12:00:00-07:00"),
  new Date("2023-05-29T12:00:00-07:00"),
];

const customEnds = {
  "5/30/2023": "12:55",
  "5/31/2023": "12:40",
  "6/1/2023": "12:40",
  "6/2/2023": "12:30",
} as { [key: string]: string };

const schoolDay = (date: Date): boolean => {
  if (date > endDate) {
    return false;
  }

  const dayOfWeek = date.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  const isExcludedDate = excludedDates.some((excludedDate) => {
    // test if days are the same

    if (
      date.getDate() === excludedDate.getDate() &&
      date.getMonth() === excludedDate.getMonth() &&
      date.getFullYear() === excludedDate.getFullYear()
    ) {
      return true;
    }
  });

  if (isExcludedDate) {
    return false;
  }

  return true;
};

const calculateDuration = () => {
  const now = new Date();

  let duration = 0;

  while (now < endDate) {
    const isSchoolDay = schoolDay(now);

    if (isSchoolDay) {
      const dayOfWeek = now.getDay();

      const startOfDay = new Date(now);

      startOfDay.setHours(
        dayOfWeek === 1 ? 10 : 8,
        dayOfWeek === 1 ? 0 : 30,
        0,
        0
      ); // 10am on Monday, 8:30am on other days

      const endOfDay = new Date(now);

      if (customEnds[now.toLocaleDateString()]) {
        // this is really hacky but I am lazy and this app will probably break in a year anyways
        endOfDay.setHours(
          +customEnds[now.toLocaleDateString()].split(":")[0],
          +customEnds[now.toLocaleDateString()].split(":")[1],
          0,
          0
        );
      } else {
        endOfDay.setHours(15, 33, 0, 0);
      }

      if (now < startOfDay || now > endOfDay) {
        console.log("Adding", (endOfDay.getTime() - startOfDay.getTime()) / 1000 / 60 / 60, "for", now);
        duration += endOfDay.getTime() - startOfDay.getTime();
      } else {
        console.log("Adding", (endOfDay.getTime() - now.getTime()) / 1000 / 60 / 60, "for", now);
        duration += endOfDay.getTime() - now.getTime();
      }
    }

    now.setHours(0, 0, 0, 0); // set time to midnight
    now.setDate(now.getDate() + 1); // add one day
  }

  console.log("Total Hours", duration / 1000 / 60 / 60)

  return Math.floor(duration / 1000) * 1000;
};

const isInSchool = (now: Date) => {
  const isSchoolDay = schoolDay(now);
  const dayOfWeek = now.getDay();

  if (!isSchoolDay) {
    return false;
  }

  const startOfDay = new Date(now);
  startOfDay.setHours(dayOfWeek === 1 ? 10 : 8, dayOfWeek === 1 ? 0 : 30, 0, 0); // 10am on Monday, 8:30am on other days

  const endOfDay = new Date(now);

  if (customEnds[now.toLocaleDateString()]) {
    // this is really hacky but I am lazy and this app will probably break in a year anyways
    endOfDay.setHours(
      +customEnds[now.toLocaleDateString()].split(":")[0],
      +customEnds[now.toLocaleDateString()].split(":")[1],
      0,
      0
    );
  } else {
    endOfDay.setHours(15, 33, 0, 0);
  }

  if (dayOfWeek == 0 || dayOfWeek == 6) {
    return false;
  }

  if (now < startOfDay || now > endOfDay) {
    return false;
  } else {
    return true;
  }
};

function calculateDays() {
  const now = new Date();

  let days = 0;

  while (now < endDate) {
    const isSchoolDay = schoolDay(now);
    const inSchoolDay = isInSchool(now);

    if (isSchoolDay && !inSchoolDay) { days++; }

    // go to midnight of the next day
    now.setDate(now.getDate() + 1);
    now.setHours(0);
    now.setMinutes(0, 0, 0);
  }

  return days;
}

export default function Home() {
  const [duration, setDuration] = useState(0);
  const [days, setDays] = useState(0);
  const { width, height } = useWindowSize();

  const seconds = Math.ceil(duration / 1000);
  const [inSchool, setInSchool] = useState(false);

  const formattedSeconds = formatter.format(seconds);
  const formattedMinutes = formatter.format(Math.floor(seconds / 60));
  const formattedHours = formatter.format(Math.floor(seconds / 60 / 60));
  const formattedDays = days.toString();

  useEffect(() => {
    setDuration(calculateDuration());
    setDays(calculateDays());
    setInSchool(isInSchool(new Date()));

    // update timer

    const interval = setInterval(() => {
      setInSchool(isInSchool(new Date()));
      setDuration(calculateDuration());
      setDays(calculateDays());
    }, 1000);


    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Head>
        <title>BHS Countdown</title>
        <meta name="description" content="Count down the seconds until the end of the 2022-2023 school year" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="https://emojicdn.elk.sh/%F0%9F%95%B0%EF%B8%8F?style=apple"
        />
        <script defer data-domain="countdown.bhs.sh" src="https://analytics.eliothertenstein.com/js/plausible.js"></script>
      </Head>
      <main
        className={clsx(
          "w-full h-screen bg-neutral-900 overflow-none text-white flex flex-col space-y-2 text-4xl items-center justify-center",
          sentient.className
        )}
      >
        {duration <= 0 && <ReactConfetti width={width} height={height} style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 100,
        }} />}
        <div className="flex flex-col space-y-2 items-center relative p-2 text-center">
          <motion.h1 className="text-4xl overflow-hidden leading-none">
            {formattedDays.split("").map((char, index) => {
              return (
                <motion.span
                  className="inline-block text-6xl"
                  key={char + index}
                  initial={{ y: "1em" }}
                  animate={{ y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    delay: (formattedDays.length - index) * 0.1,
                  }}
                >
                  {char}
                </motion.span>
              );
            })}{" "}
            {days === 1 ? "day" : "days"}
          </motion.h1>
          <motion.h2 className="text-4xl overflow-hidden leading-none">
            {formattedHours.split("").map((char, index) => {
              return (
                <motion.span
                  className="inline-block"
                  key={char + index}
                  initial={{ y: "1em" }}
                  animate={{ y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    delay: (formattedHours.length - index) * 0.1,
                  }}
                >
                  {char}
                </motion.span>
              );
            })}{" "}
            hours
          </motion.h2>
          <motion.h3 className="text-2xl overflow-hidden leading-none">
            {formattedMinutes.split("").map((char, index) => {
              return (
                <motion.span
                  className="inline-block"
                  key={char + index}
                  initial={{ y: "1em" }}
                  animate={{ y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    delay: (formattedMinutes.length - index) * 0.1,
                  }}
                >
                  {char}
                </motion.span>
              );
            })}{" "}
            minutes
          </motion.h3>
          <motion.h4 className="text-xl overflow-hidden leading-none">
            {formattedSeconds.split("").map((char, index) => {
              return (
                <motion.span
                  className="inline-block"
                  key={char + index}
                  initial={{ y: "1em" }}
                  animate={{ y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    delay: (formattedSeconds.length - index) * 0.1,
                  }}
                >
                  {char}
                </motion.span>
              );
            })}{" "}
            seconds
          </motion.h4>

          {!inSchool && duration > 0 ? (
            <span className="text-sm text-neutral-400 pt-4">
              The timer only counts when school is in session.
            </span>
          ) : (<span className="text-sm text-neutral-400 pt-4">
            Duration only includes time in school.
          </span>)}
          <span className="text-sm text-neutral-400">
            Made by{" "}
            <a
              href="https://eliothertenstein.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white"
            >
              Eliot
            </a>
          </span>
          <span className="text-sm text-neutral-400">
            Inspired by{" "}
            <a
              href="https://progress.elk.sh/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white"
            >
              Ben
            </a>
          </span>
        </div>
      </main>
    </>
  );
}
